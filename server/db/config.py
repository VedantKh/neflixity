from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import getpass
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file in development
if os.getenv('RAILWAY_ENVIRONMENT') != 'production':
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)

# Get current system username for default database URL
current_user = getpass.getuser()

# Get DATABASE_URL from environment with fallback for local development
DATABASE_URL = os.getenv('DATABASE_URL', f'postgresql://{current_user}@localhost:5432/netflixity')

# Fix Railway's postgres:// URLs to postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine settings based on environment
if os.getenv('RAILWAY_ENVIRONMENT') == 'production':
    # Production settings optimized for Railway
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,  # Start with a smaller pool in production
        max_overflow=10,  # Allow up to 10 connections beyond pool_size
        pool_timeout=30,  # Timeout after 30 seconds
        pool_recycle=1800,  # Recycle connections after 30 minutes
        pool_pre_ping=True,  # Enable connection health checks
        echo=False  # Disable SQL logging in production
    )
else:
    # Development settings
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        echo=bool(os.getenv('SQL_ECHO', True))  # Enable SQL logging by default in development
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 