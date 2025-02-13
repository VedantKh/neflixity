from flask import Blueprint, request, jsonify
from typing import List, Dict, Any
import numpy as np
from openai import OpenAI
import os
from db.config import get_db
from services.embedding_service import EmbeddingService

vector_search = Blueprint('vector_search', __name__)

def check_api_key() -> str:
    """Check and return the OpenAI API key from environment variables."""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return api_key

def get_embeddings(texts: List[str], batch_size: int = 100) -> np.ndarray:
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

@vector_search.route('/api/vector_search', methods=['POST'])
def search():
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
            threshold=0.1
        )
        
        return jsonify({
            'results': similar_movies
        })

    except Exception as e:
        print(f"Error in vector_search: {str(e)}")
        return jsonify({'error': str(e)}), 500

@vector_search.route('/api/embeddings/batch', methods=['POST'])
def batch_upsert():
    try:
        data = request.get_json()
        if not data or 'embeddings' not in data:
            return jsonify({'error': 'No embeddings provided'}), 400

        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)

        # Process embeddings
        successful_ids = embedding_service.batch_upsert_embeddings(data['embeddings'])

        return jsonify({
            'success': True,
            'processed_count': len(successful_ids),
            'processed_ids': successful_ids
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500 