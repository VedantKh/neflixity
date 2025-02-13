from flask import Blueprint, request, jsonify
from typing import List, Dict, Any
import numpy as np
from db.config import get_db
from services.embedding_service import EmbeddingService
import logging
import os
import tempfile

logger = logging.getLogger(__name__)
vector_search = Blueprint('vector_search', __name__)

@vector_search.route('/api/vector_search/test', methods=['GET'])
def test_vector_search():
    """Test endpoint to verify vector search functionality."""
    try:
        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)

        # Create a test embedding (normalized random vector)
        test_embedding = np.random.randn(1536)  # OpenAI embedding size
        test_embedding = test_embedding / np.linalg.norm(test_embedding)

        # Get similar movies
        similar_movies = embedding_service.get_similar_movies(
            query_embedding=test_embedding,
            limit=5,
            threshold=0.0  # No threshold for testing
        )

        return jsonify({
            'status': 'success',
            'message': 'Vector search is working',
            'database_status': 'connected',
            'embedding_service': 'operational',
            'results_found': len(similar_movies),
            'sample_results': similar_movies[:2] if similar_movies else [],
            'embedding_shape': test_embedding.shape
        })

    except Exception as e:
        logger.error(f"Vector search test failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': str(e),
            'database_status': 'error',
            'embedding_service': 'error'
        }), 500

@vector_search.route('/api/vector_search', methods=['POST'])
def search():
    """Main vector search endpoint."""
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'No query provided'}), 400

        logger.info(f"Received search query: {data['query']}")

        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)

        # Get query embedding from request
        query = data['query']
        query_embedding = np.array(data.get('query_embedding', []), dtype=np.float32)

        # If no embedding provided, return error
        if len(query_embedding) == 0:
            return jsonify({'error': 'No query embedding provided'}), 400

        logger.info("Getting similar movies...")
        # Get similar movies
        similar_movies = embedding_service.get_similar_movies(
            query_embedding=query_embedding,
            limit=data.get('limit', 10),
            threshold=data.get('threshold', 0.5)
        )
        logger.info(f"Found {len(similar_movies)} similar movies")

        return jsonify({
            'results': similar_movies,
            'query': query,
            'result_count': len(similar_movies)
        })

    except Exception as e:
        logger.error(f"Search failed: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@vector_search.route('/api/embeddings/batch', methods=['POST'])
def batch_upsert():
    """Batch upsert embeddings endpoint."""
    try:
        data = request.get_json()
        if not data or 'embeddings' not in data:
            return jsonify({'error': 'No embeddings provided'}), 400

        logger.info(f"Received batch upsert request with {len(data['embeddings'])} embeddings")

        # Get database session
        db = next(get_db())
        embedding_service = EmbeddingService(db)

        # Process embeddings
        successful_ids = embedding_service.batch_upsert_embeddings(data['embeddings'])
        logger.info(f"Successfully processed {len(successful_ids)} embeddings")

        return jsonify({
            'success': True,
            'processed_count': len(successful_ids),
            'processed_ids': successful_ids
        })

    except Exception as e:
        logger.error(f"Batch upsert failed: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@vector_search.route('/api/embeddings/upload-matrix', methods=['POST'])
def upload_embeddings_matrix():
    """Upload embeddings matrix and process it into the database."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename != 'embeddings_matrix.npy':
            return jsonify({'error': 'Invalid file name. Must be embeddings_matrix.npy'}), 400

        # Save file to temporary location
        logger.info("Saving uploaded file to temporary location...")
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, 'embeddings_matrix.npy')
        file.save(temp_path)
        logger.info(f"File saved to {temp_path}")

        try:
            # Load the numpy array
            logger.info("Loading embeddings matrix...")
            embeddings_matrix = np.load(temp_path, allow_pickle=True)
            logger.info(f"Loaded embeddings matrix with shape: {embeddings_matrix.shape}")

            # Get database session
            db = next(get_db())
            embedding_service = EmbeddingService(db)

            # Process embeddings in batches
            batch_size = 100
            successful_ids = []
            total_embeddings = len(embeddings_matrix)

            for i in range(0, total_embeddings, batch_size):
                batch_end = min(i + batch_size, total_embeddings)
                batch = embeddings_matrix[i:batch_end]
                
                # Create batch data
                batch_data = [
                    {
                        'movie_id': idx,
                        'embedding': emb,
                        'document': f'Movie {idx}'
                    }
                    for idx, emb in enumerate(batch, start=i)
                ]

                # Process batch
                logger.info(f"Processing batch {i//batch_size + 1}/{(total_embeddings + batch_size - 1)//batch_size}")
                result = embedding_service.batch_upsert_embeddings(batch_data)
                successful_ids.extend(result)
                
                # Log progress
                logger.info(f"Processed {len(successful_ids)}/{total_embeddings} embeddings")

            return jsonify({
                'success': True,
                'message': 'Embeddings matrix processed successfully',
                'processed_count': len(successful_ids),
                'total_embeddings': total_embeddings,
                'matrix_shape': embeddings_matrix.shape
            })

        finally:
            # Clean up temporary file
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
                logger.info("Cleaned up temporary files")
            except Exception as e:
                logger.error(f"Error cleaning up temporary files: {str(e)}")

    except Exception as e:
        logger.error(f"Failed to process embeddings matrix: {str(e)}", exc_info=True)
        return jsonify({
            'error': str(e)
        }), 500 