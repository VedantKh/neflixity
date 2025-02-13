from logging.config import fileConfig
import logging
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('alembic.migration')

# Add the parent directory to Python path so we can import from db
sys.path.append(str(Path(__file__).parent.parent))

from db.config import DATABASE_URL
from db.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the database URL in the alembic.ini file
config.set_main_option('sqlalchemy.url', DATABASE_URL)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    logger.info("Running migrations offline")
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()
    logger.info("Offline migrations completed")

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    logger.info("Starting online migrations")
    logger.info(f"Using database URL: {DATABASE_URL.split('@')[1] if DATABASE_URL else 'None'}")  # Log only host/db part
    
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            logger.info("Running migrations...")
            context.run_migrations()
            logger.info("Migrations completed successfully")

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
