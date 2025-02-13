from sqlalchemy import Column, Integer, LargeBinary, String, DateTime, Float, Index, event
from sqlalchemy.sql import func
from datetime import datetime
import numpy as np
from typing import Optional
from .config import Base

class MovieEmbedding(Base):
    __tablename__ = "movie_embeddings"

    id = Column(Integer, primary_key=True)
    movie_id = Column(Integer, unique=True, index=True, nullable=False)
    embedding = Column(LargeBinary, nullable=False)
    document = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def set_embedding(self, embedding_array: np.ndarray) -> None:
        """Set the embedding array after validation."""
        if not isinstance(embedding_array, np.ndarray):
            raise ValueError("Embedding must be a numpy array")
        
        if embedding_array.dtype != np.float32:
            embedding_array = embedding_array.astype(np.float32)
        
        if len(embedding_array.shape) != 1:
            raise ValueError("Embedding must be a 1D array")
        
        self.embedding = embedding_array.tobytes()

    def get_embedding(self) -> Optional[np.ndarray]:
        """Get the embedding as a numpy array."""
        try:
            if not self.embedding:
                return None
            return np.frombuffer(self.embedding, dtype=np.float32)
        except Exception as e:
            print(f"Error retrieving embedding for movie {self.movie_id}: {str(e)}")
            return None

    @staticmethod
    def create_from_array(movie_id: int, embedding_array: np.ndarray, document: str) -> "MovieEmbedding":
        """Create a new MovieEmbedding instance from a numpy array."""
        embedding = MovieEmbedding(movie_id=movie_id, document=document)
        embedding.set_embedding(embedding_array)
        return embedding

    def __repr__(self) -> str:
        return f"<MovieEmbedding(movie_id={self.movie_id}, created_at={self.created_at})>"

# Create indexes for better query performance
Index('idx_movie_embedding_movie_id', MovieEmbedding.movie_id)
Index('idx_movie_embedding_created_at', MovieEmbedding.created_at) 