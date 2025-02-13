from flask import Blueprint, request, jsonify
from typing import List, Dict, Any
import numpy as np
from db.config import get_db
from services.embedding_service import EmbeddingService

vector_search = Blueprint('vector_search', __name__)

@vector_search.route('/api/vector_search', methods=['POST'])
def search():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'No query provided'}), 400

        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)

        # Get query embedding from request
        query = data['query']
        query_embedding = np.array(data.get('query_embedding', []), dtype=np.float32)

        # If no embedding provided, return error
        if len(query_embedding) == 0:
            return jsonify({'error': 'No query embedding provided'}), 400

        # Get similar movies
        similar_movies = embedding_service.get_similar_movies(
            query_embedding=query_embedding,
            limit=data.get('limit', 10),
            threshold=data.get('threshold', 0.5)
        )

        return jsonify({
            'results': similar_movies,
            'query': query
        })

    except Exception as e:
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