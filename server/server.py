from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from openai import OpenAI
from typing import List, Tuple
import os
from ast import literal_eval
from pathlib import Path
from dotenv import load_dotenv
from db.config import get_db
from services.embedding_service import EmbeddingService

load_dotenv()

def check_api_key() -> str:
    """Check and return the OpenAI API key from environment variables."""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return api_key

# app instance
app = Flask(__name__)
# Configure CORS to allow requests from your Next.js app
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://neflixity.vercel.app"  # Add your Vercel domain here
        ],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

def prep_for_embeddings(name: str, description: str, keywords_list: str, id: str) -> Tuple[int, str]:
    """Prepare movie data for embeddings by combining title, description and keywords."""
    id = int(id)
    keywords_str = ""
    try:
        if isinstance(keywords_list, str):
            parsed_keywords = literal_eval(keywords_list)
            if parsed_keywords:
                keyword_names = [k['name'] for k in parsed_keywords]
                if keyword_names:
                    keywords_str = f" Keywords: {', '.join(keyword_names)}."
    except (ValueError, SyntaxError, AttributeError) as e:
        print(f"Error parsing keywords: {e}")  # Log the specific error
            
    return id, f'Title: {name}. Description: {description}{keywords_str}'

def get_embeddings_and_scores(queries: List[str], documents: List[str]) -> Tuple[np.ndarray, List[List[float]]]:
    """
    Get embeddings using OpenAI's API and compute similarity scores.
    """
    client = OpenAI(api_key=check_api_key())

    # Get embeddings for all texts
    all_texts = queries + documents
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=all_texts,
        encoding_format="float"
    )

    # Extract embeddings from response
    embeddings = np.array([e.embedding for e in response.data])

    # Split into query and document embeddings
    query_embeddings = embeddings[:len(queries)]
    doc_embeddings = embeddings[len(queries):]

    # Compute similarity scores
    scores = (query_embeddings @ doc_embeddings.T) * 100

    return embeddings, scores.tolist()

def get_embeddings(texts: List[str], batch_size: int = 100) -> np.ndarray:
    """
    Get embeddings using OpenAI's API in batches.
    """
    client = OpenAI(api_key=check_api_key())
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1} of {len(texts)//batch_size + 1}")
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
            encoding_format="float"
        )
        batch_embeddings = [e.embedding for e in response.data]
        all_embeddings.extend(batch_embeddings)
    
    return np.array(all_embeddings)

@app.route('/api/make_embeddings', methods=['POST'])
def prepare_documents():
    try:
        print("Received request to /api/make_embeddings")
        data = request.get_json()
        print(f"Received data keys: {data.keys() if data else 'None'}")
        
        if 'movies' not in data or 'keywords' not in data:
            print("Missing required data fields")
            return jsonify({'error': 'Both movies and keywords data are required'}), 400
        
        # Convert JSON to DataFrames
        print(f"Movies data sample: {data['movies'][:2] if data['movies'] else 'Empty'}")
        print(f"Keywords data sample: {data['keywords'][:2] if data['keywords'] else 'Empty'}")
        
        movies_df = pd.DataFrame(data['movies'])
        keywords_df = pd.DataFrame(data['keywords'])
        
        print(f"Created DataFrames - Movies shape: {movies_df.shape}, Keywords shape: {keywords_df.shape}")
        
        # Prepare documents
        id_doc_pairs = list(map(
            prep_for_embeddings,
            movies_df["title"],
            movies_df["overview"],
            keywords_df["keywords"],
            movies_df["id"]
        ))
        
        # Separate IDs and documents
        ids, documents = zip(*id_doc_pairs)
        
        print(f"Generated {len(documents)} documents")
        print(f"First document sample: {documents[0] if documents else 'None'}")
        
        # Get embeddings for documents
        print("Computing embeddings...")
        embeddings = get_embeddings(list(documents))
        print(f"Generated embeddings shape: {embeddings.shape}")
        
        # Store embeddings in database
        print("Storing embeddings in database...")
        db = next(get_db())
        embedding_service = EmbeddingService(db)
        
        # Prepare data for batch upsert
        embeddings_data = [
            {
                'movie_id': movie_id,
                'embedding': embedding,
                'document': document
            }
            for movie_id, embedding, document in zip(ids, embeddings, documents)
        ]
        
        # Batch upsert embeddings
        successful_ids = embedding_service.batch_upsert_embeddings(embeddings_data)
        print(f"Successfully stored {len(successful_ids)} embeddings in database")
        
        return jsonify({
            'success': True,
            'processed_count': len(successful_ids),
            'processed_ids': successful_ids
        })
        
    except Exception as e:
        print(f"Error in prepare_documents: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/vector_search', methods=['POST'])
def vector_search():
    try:
        print("Received request to /api/vector_search")
        data = request.get_json()
        print(f"Request data: {data.keys()}")
        
        if not data or 'query' not in data:
            return jsonify({'error': 'Query is required'}), 400
        
        # Get the search query
        search_query = data['query']
        
        # Get query embedding
        query_embedding = get_embeddings([search_query])[0]
        
        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)
        
        # Get similar movies
        similar_movies = embedding_service.get_similar_movies(
            query_embedding=query_embedding,
            limit=20,  # Get top 20 results
            threshold=0.5
        )
        
        return jsonify({
            'results': similar_movies
        })

    except Exception as e:
        print(f"Error in vector_search: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset_embeddings', methods=['POST'])
def reset_embeddings():
    """Delete all embeddings from the database."""
    try:
        db = next(get_db())
        embedding_service = EmbeddingService(db)
        
        # Delete all records from movie_embeddings table
        db.query(MovieEmbedding).delete()
        db.commit()
        
        return jsonify({'message': 'All embeddings successfully deleted from database'})
    except Exception as e:
        print(f"Error in reset_embeddings: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

