from flask import Flask, jsonify
from flask_cors import CORS
from routes.vector_search import vector_search
from db.config import get_db, engine
from sqlalchemy import text

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(vector_search)

@app.before_request
def before_request():
    # Ensure database connection
    next(get_db())

@app.route('/health')
def health_check():
    """Health check endpoint for Railway."""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        return jsonify({
            'status': 'healthy',
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True) 