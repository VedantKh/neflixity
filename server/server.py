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
        "origins": ["http://localhost:3000"],
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

def get_detailed_instruct(task_description: str, query: str) -> str:
    return f'Instruct: {task_description}\nQuery: {query}'

def get_embeddings_and_scores(queries: List[str], documents: List[str]) -> Tuple[np.ndarray, List[List[float]]]:
    """
    Get embeddings using OpenAI's API and compute similarity scores.

    Args:
        queries: List of query strings
        documents: List of document strings

    Returns:
        tuple: (embeddings array, similarity scores matrix)
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

    # Compute similarity scores (same as your original computation)
    # Note: embeddings from OpenAI are already normalized
    scores = (query_embeddings @ doc_embeddings.T) * 100

    return embeddings, scores.tolist()

def load_or_compute_embeddings(documents: List[str], batch_size: int = 100) -> np.ndarray:
    """
    Load embeddings from file if they exist, otherwise compute and save them.
    """
    # Create embeddings directory if it doesn't exist
    embeddings_dir = Path("embeddings")
    embeddings_dir.mkdir(exist_ok=True)
    
    embeddings_file = embeddings_dir / f"embeddings_matrix.npy"
    
    # If embeddings file exists, load it
    if embeddings_file.exists():
        print("Loading existing embeddings from file")
        return np.load(embeddings_file)
    
    # Otherwise, compute embeddings
    print("Computing new embeddings")
    client = OpenAI(api_key=check_api_key())
    
    all_doc_embeddings = []
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1} of {len(documents)//batch_size + 1}")
        
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
            encoding_format="float"
        )
        batch_embeddings = [e.embedding for e in response.data]
        all_doc_embeddings.extend(batch_embeddings)
    
    doc_embeddings = np.array(all_doc_embeddings)
    
    # Save embeddings to file
    np.save(embeddings_file, doc_embeddings)
    return doc_embeddings

def batch_get_embeddings_and_scores(queries: List[str], documents: List[str], batch_size: int = 100) -> List[List[float]]:
    """
    Get embeddings using OpenAI's API and compute similarity scores in batches.
    """
    client = OpenAI(api_key=check_api_key())    
    # Get query embeddings
    query_response = client.embeddings.create(
        model="text-embedding-3-small",
        input=queries,
        encoding_format="float"
    )
    query_embeddings = np.array([e.embedding for e in query_response.data])
    
    # Load or compute document embeddings
    doc_embeddings = load_or_compute_embeddings(documents, batch_size)
    
    # Compute similarity scores
    scores = (query_embeddings @ doc_embeddings.T) * 100
    
    return scores.tolist()

# Example usage:
task = 'Given a movie query, analyze the plot elements and themes to retrieve relevant movie names and descriptions that match the query'
searches = [
    "A children's animated movie about toys coming to life, perfect for family viewing",
    "An adventure movie featuring dangerous wild animals and a magical board game",
    "A comedy about elderly neighbors, fishing, and romance"
]
queries = list(map(get_detailed_instruct, [task]*3, searches))


# embeddings, scores = get_embeddings_and_scores(queries, documents)
# for row in scores:
#     print(documents[np.argmax(row)])

@app.route('/api/make_embeddings', methods=['POST'])
def prepare_documents():
    try:
        # Get JSON data from request
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
        
        return jsonify({
            'documents': documents,
            'ids': ids
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
        
        if not data or 'query' not in data or 'documents' not in data:
            return jsonify({'error': 'Query and documents are required'}), 400
        
        # Log the movie IDs
        print(f"Number of movie IDs received: {len(data['ids'])}")
        print(f"First few movie IDs: {data['ids'][:5]}")
        
        # Get the search query and documents
        search_query = data['query']
        documents = data['documents']
        movie_ids = data['ids']
        
        # Create the task description and query
        task = 'Given a movie query, analyze the plot elements and themes to retrieve relevant movie names and descriptions that match the query'
        query = get_detailed_instruct(task, search_query)
        
        # Get embeddings and scores in batches
        scores = batch_get_embeddings_and_scores([query], documents)
        
        # Get top 20 results
        top_scores = scores[0]
        top_indices = np.argsort(top_scores)[-20:][::-1]
        
        # Log the results
        print(f"Top 30 indices: {top_indices}")
        print(f"Corresponding movie IDs: {[movie_ids[idx] for idx in top_indices]}")
        
        results = [{
            'document': documents[idx],
            'score': float(top_scores[idx]),
            'movie_id': movie_ids[idx]
        } for idx in top_indices]

        return jsonify({
            'results': results
        })

    except Exception as e:
        print(f"Error in vector_search: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)

