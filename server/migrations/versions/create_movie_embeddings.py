"""create movie embeddings table

Revision ID: 01_create_movie_embeddings
Revises: 
Create Date: 2024-03-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '01_create_movie_embeddings'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create movie_embeddings table
    op.create_table(
        'movie_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('movie_id', sa.Integer(), nullable=False),
        sa.Column('embedding', sa.LargeBinary(), nullable=False),
        sa.Column('document', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_movie_embeddings_movie_id', 'movie_embeddings', ['movie_id'], unique=True)
    op.create_index('idx_movie_embeddings_created_at', 'movie_embeddings', ['created_at'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_movie_embeddings_created_at')
    op.drop_index('idx_movie_embeddings_movie_id')
    
    # Drop table
    op.drop_table('movie_embeddings') 