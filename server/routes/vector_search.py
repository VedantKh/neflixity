from flask import Blueprint, request, jsonify
from typing import List, Dict, Any
import numpy as np
from openai import OpenAI
import os
import traceback
import logging
from db.config import get_db
from services.embedding_service import EmbeddingService
from db.models import MovieEmbedding

vector_search = Blueprint('vector_search', __name__)

logger = logging.getLogger(__name__)

def check_api_key() -> str:
    """Check and return the OpenAI API key from environment variables."""
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY environment variable is not set")
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return api_key

def get_embeddings(texts: List[str], batch_size: int = 100) -> np.ndarray:
    """Get embeddings using OpenAI's API in batches."""
    try:
        api_key = check_api_key()
        logger.info("Successfully retrieved API key")
        
        client = OpenAI(api_key=api_key)
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1} of {len(texts)//batch_size + 1}")
            
            try:
                response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=batch,
                    encoding_format="float"
                )
                batch_embeddings = [e.embedding for e in response.data]
                all_embeddings.extend(batch_embeddings)
            except Exception as e:
                logger.error(f"Error getting embeddings from OpenAI: {str(e)}")
                logger.error(traceback.format_exc())
                raise
        
        return np.array(all_embeddings)
    except Exception as e:
        logger.error(f"Error in get_embeddings: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@vector_search.route('/api/vector_search', methods=['POST'])
def search():
    try:
        logger.info("Received request to /api/vector_search")
        data = request.get_json()
        logger.info(f"Request data keys: {data.keys() if data else 'None'}")
        
        if not data or 'query' not in data:
            logger.error("Missing query in request data")
            return jsonify({'error': 'Query is required'}), 400
        
        # Get the search query
        search_query = data['query']
        logger.info(f"Processing search query: {search_query}")
        
        try:
            # Get query embedding
            logger.info("Getting query embedding from OpenAI")
            query_embedding = get_embeddings([search_query])[0]
            logger.info("Successfully got query embedding")
            
            # Get database session
            logger.info("Getting database session")
            db = next(get_db())
            embedding_service = EmbeddingService(db)
            
            # Get similar movies
            logger.info("Finding similar movies")
            similar_movies = embedding_service.get_similar_movies(
                query_embedding=query_embedding,
                limit=20,  # Get top 20 results
                threshold=0.1
            )
            logger.info(f"Found {len(similar_movies)} similar movies")
            
            return jsonify({
                'results': similar_movies
            })
        except Exception as e:
            logger.error(f"Error processing search: {str(e)}")
            logger.error(traceback.format_exc())
            raise

    except Exception as e:
        logger.error(f"Error in vector_search: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

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

@vector_search.route('/api/check_openai', methods=['GET'])
def check_openai():
    """Check if OpenAI API key is configured."""
    try:
        api_key = check_api_key()
        # Create a simple test embedding to verify the key works
        client = OpenAI(api_key=api_key)
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input="test",
            encoding_format="float"
        )
        return jsonify({
            'status': 'ok',
            'message': 'OpenAI API key is configured and working'
        })
    except Exception as e:
        logger.error(f"OpenAI API key check failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@vector_search.route('/api/check_db', methods=['GET'])
def check_db():
    """Check if we can access the database and movie embeddings."""
    try:
        db = next(get_db())
        count = db.query(MovieEmbedding).count()
        sample = db.query(MovieEmbedding).first()
        
        return jsonify({
            'status': 'ok',
            'total_embeddings': count,
            'has_sample': sample is not None,
            'sample_movie_id': sample.movie_id if sample else None
        })
    except Exception as e:
        logger.error(f"Database check failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500 