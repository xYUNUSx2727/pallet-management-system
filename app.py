import os
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager
import urllib.parse

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

app = Flask(__name__)

# Parse DATABASE_URL and properly encode password
db_url = os.environ.get("DATABASE_URL")
if db_url:
    parsed = urllib.parse.urlparse(db_url)
    if parsed.password:
        encoded_password = urllib.parse.quote(parsed.password)
        db_url = db_url.replace(parsed.password, encoded_password)

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or os.urandom(24)
app.config["SQLALCHEMY_DATABASE_URI"] = db_url
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

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Error handlers
@app.errorhandler(403)
def forbidden_error(error):
    return render_template('403.html'), 403

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

# Clean shutdown
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

# Initialize database and import routes
with app.app_context():
    import models
    db.create_all()
    
    # Import routes after db initialization
    from routes import *

    # Only seed data if tables are empty
    from models import User
    if not User.query.first():
        from seed_data import seed_data
        seed_data()
