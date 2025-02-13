from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from openai import OpenAI
import os
from ast import literal_eval
from db.config import get_db
from services.embedding_service import EmbeddingService

embeddings = Blueprint('embeddings', __name__)

def check_api_key() -> str:
    """Check and return the OpenAI API key from environment variables."""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return api_key

def prep_for_embeddings(name: str, description: str, keywords_list: str, id: str) -> tuple[int, str]:
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
        print(f"Error parsing keywords: {e}")
            
    return id, f'Title: {name}. Description: {description}{keywords_str}'

def get_embeddings(texts: list[str], batch_size: int = 100) -> np.ndarray:
    """Get embeddings using OpenAI's API in batches."""
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

@embeddings.route('/api/make_embeddings', methods=['POST'])
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
        embeddings_array = get_embeddings(list(documents))
        print(f"Generated embeddings shape: {embeddings_array.shape}")
        
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
            for movie_id, embedding, document in zip(ids, embeddings_array, documents)
        ]
        
        # Batch upsert embeddings
        successful_ids = embedding_service.batch_upsert_embeddings(embeddings_data)
        print(f"Successfully stored {len(successful_ids)} embeddings in database")
        
        return jsonify({
            'success': True,
            'documents': documents,
            'ids': list(ids),
            'processed_count': len(successful_ids),
            'processed_ids': successful_ids
        })
        
    except Exception as e:
        print(f"Error in prepare_documents: {str(e)}")
        return jsonify({'error': str(e)}), 500 