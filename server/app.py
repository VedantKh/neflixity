from flask import Flask, jsonify
from flask_cors import CORS
from routes.vector_search import vector_search
from routes.embeddings import embeddings
from db.config import get_db, engine
from sqlalchemy import text, inspect
import logging
import sys
import traceback
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from alembic.config import Config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(vector_search)
app.register_blueprint(embeddings)

@app.before_request
def before_request():
    """Ensure database connection before each request."""
    try:
        next(get_db())
        logger.debug("Database connection successful in before_request")
    except Exception as e:
        logger.error(f"Database connection failed in before_request: {str(e)}")
        raise

def get_migration_status():
    """Get current migration status."""
    try:
        # Get current revision
        migration_ctx = MigrationContext.configure(engine.connect())
        current_rev = migration_ctx.get_current_revision()
        
        # Get latest available revision
        config = Config("alembic.ini")
        script = ScriptDirectory.from_config(config)
        head_rev = script.get_current_head()
        
        status = {
            'current_revision': current_rev,
            'latest_revision': head_rev,
            'is_current': current_rev == head_rev
        }
        logger.info(f"Migration status: {status}")
        return status
    except Exception as e:
        logger.error(f"Error checking migration status: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }

@app.route('/health')
def health_check():
    """Health check endpoint for Railway."""
    try:
        # Test database connection
        logger.info("Health check: Testing database connection...")
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            logger.info("Health check: Database connection successful")
            
        # Get migration status
        logger.info("Health check: Checking migration status...")
        migration_status = get_migration_status()
        logger.info(f"Health check: Migration status retrieved: {migration_status}")
        
        response = {
            'status': 'healthy',
            'database': 'connected',
            'migrations': migration_status,
            'environment': {
                'python_version': sys.version,
                'database_host': str(engine.url.host),
                'database_name': str(engine.url.database)
            }
        }
        logger.info("Health check: Completed successfully")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Health check failed: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        return jsonify({
            'status': 'unhealthy',
            'database': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/migrations/status')
def migration_status():
    """Check current migration status."""
    try:
        status = get_migration_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"Migration status check failed: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

# Error handlers
@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal Server Error: {str(error)}")
    logger.error(traceback.format_exc())
    return jsonify({
        'error': 'Internal Server Error',
        'message': str(error),
        'traceback': traceback.format_exc()
    }), 500

@app.errorhandler(Exception)
def handle_exception(error):
    logger.error(f"Unhandled Exception: {str(error)}")
    logger.error(traceback.format_exc())
    return jsonify({
        'error': 'Unhandled Exception',
        'message': str(error),
        'traceback': traceback.format_exc()
    }), 500

if __name__ == '__main__':
    try:
        # Log startup information
        logger.info("Starting Flask application...")
        logger.info(f"Python version: {sys.version}")
        logger.info(f"Database URL: {engine.url.host}/{engine.url.database}")
        
        # Test database connection
        logger.info("Testing database connection...")
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
            logger.info("Database connection successful")
        
        # Check migration status
        logger.info("Checking migration status...")
        migration_status = get_migration_status()
        logger.info(f"Migration status: {migration_status}")
        
        app.run(debug=True, host='0.0.0.0')
    except Exception as e:
        logger.error(f"Application startup failed: {str(e)}")
        logger.error(traceback.format_exc())
        sys.exit(1) 