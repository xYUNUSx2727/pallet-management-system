import os
import logging
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager
import urllib.parse
import pymysql
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

pymysql.install_as_MySQLdb()

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

app = Flask(__name__)

# Configure MySQL connection using environment variables
try:
    app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)
    DATABASE_URL = os.environ.get('DATABASE_URL')

    if not DATABASE_URL:
        # Construct MySQL URL from individual parameters
        db_params = {
            'user': os.environ.get('PGUSER'),
            'password': os.environ.get('PGPASSWORD'),
            'host': os.environ.get('PGHOST'),
            'port': os.environ.get('PGPORT'),
            'database': os.environ.get('PGDATABASE')
        }
        
        # Validate database parameters
        missing_params = [k for k, v in db_params.items() if not v]
        if missing_params:
            raise ValueError(f"Missing database parameters: {', '.join(missing_params)}")
        
        DATABASE_URL = f"mysql+pymysql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['database']}"

    if DATABASE_URL.startswith('postgres://'):
        # Convert PostgreSQL URL to MySQL URL
        url = urllib.parse.urlparse(DATABASE_URL)
        DATABASE_URL = f"mysql+pymysql://{url.username}:{url.password}@{url.hostname}:{url.port}/{url.path[1:]}"

    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_timeout": 900,
        "pool_size": 10,
        "max_overflow": 5,
    }

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    login_manager.login_message = 'Lütfen önce giriş yapın.'
    login_manager.login_message_category = 'warning'

    logger.info("Database connection established successfully")

except Exception as e:
    logger.error(f"Database connection error: {str(e)}")
    raise

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Error handlers
@app.errorhandler(403)
def forbidden_error(error):
    logger.warning(f"403 error: {str(error)}")
    return render_template('403.html'), 403

@app.errorhandler(404)
def not_found_error(error):
    logger.warning(f"404 error: {str(error)}")
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {str(error)}")
    db.session.rollback()
    return render_template('500.html'), 500

# Clean shutdown
@app.teardown_appcontext
def shutdown_session(exception=None):
    if exception:
        logger.error(f"Error during session cleanup: {str(exception)}")
    db.session.remove()

# Initialize database and import routes
with app.app_context():
    try:
        import models
        db.drop_all()  # Drop existing tables
        db.create_all()  # Create new tables
        logger.info("Database tables created successfully")
        
        # Import routes after db initialization
        from routes import *
        
        # Only seed data if tables are empty
        from models import User
        if not User.query.first():
            from seed_data import seed_data
            seed_data()
            logger.info("Initial data seeding completed")
            
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
        raise
