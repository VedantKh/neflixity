from typing import List, Dict, Optional, Any
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from functools import lru_cache
import time
from db.models import MovieEmbedding
from db.config import get_db

class EmbeddingService:
    def __init__(self, db: Session):
        self.db = db
        self._batch_size = 100
        self._retry_attempts = 3
        self._retry_delay = 1  # seconds

    @lru_cache(maxsize=1000)
    def get_embedding(self, movie_id: int) -> Optional[np.ndarray]:
        """Get embedding for a movie with caching."""
        try:
            embedding = self.db.query(MovieEmbedding).filter(
                MovieEmbedding.movie_id == movie_id
            ).first()
            return embedding.get_embedding() if embedding else None
        except Exception as e:
            print(f"Error retrieving embedding for movie {movie_id}: {str(e)}")
            return None

    def batch_upsert_embeddings(
        self, 
        embeddings_data: List[Dict[str, Any]]
    ) -> List[int]:
        """Batch upsert embeddings with retry logic."""
        successful_ids = []
        
        # Process in batches
        for i in range(0, len(embeddings_data), self._batch_size):
            batch = embeddings_data[i:i + self._batch_size]
            
            for attempt in range(self._retry_attempts):
                try:
                    successful_ids.extend(
                        self._process_batch(batch)
                    )
                    break
                except SQLAlchemyError as e:
                    if attempt == self._retry_attempts - 1:
                        print(f"Failed to process batch after {self._retry_attempts} attempts: {str(e)}")
                    else:
                        time.sleep(self._retry_delay)
                        continue

        return successful_ids

    def _process_batch(self, batch: List[Dict[str, Any]]) -> List[int]:
        """Process a batch of embeddings."""
        successful_ids = []
        
        for item in batch:
            try:
                # Check if embedding exists
                existing = self.db.query(MovieEmbedding).filter(
                    MovieEmbedding.movie_id == item['movie_id']
                ).first()

                if existing:
                    # Update existing
                    existing.set_embedding(item['embedding'])
                    existing.document = item['document']
                else:
                    # Create new
                    embedding = MovieEmbedding.create_from_array(
                        movie_id=item['movie_id'],
                        embedding_array=item['embedding'],
                        document=item['document']
                    )
                    self.db.add(embedding)

                successful_ids.append(item['movie_id'])
            except Exception as e:
                print(f"Error processing movie {item['movie_id']}: {str(e)}")
                continue

        self.db.commit()
        return successful_ids

    def get_similar_movies(
        self, 
        query_embedding: np.ndarray, 
        limit: int = 10,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """Find similar movies using cosine similarity."""
        try:
            # Get all embeddings
            embeddings = self.db.query(MovieEmbedding).all()
            
            if not embeddings:
                return []

            # Calculate similarities
            similarities = []
            for emb in embeddings:
                movie_embedding = emb.get_embedding()
                if movie_embedding is not None:
                    similarity = self._cosine_similarity(query_embedding, movie_embedding)
                    if similarity >= threshold:
                        similarities.append({
                            'movie_id': emb.movie_id,
                            'similarity': float(similarity),
                            'document': emb.document
                        })

            # Sort by similarity
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            return similarities[:limit]

        except Exception as e:
            print(f"Error finding similar movies: {str(e)}")
            return []

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))) 