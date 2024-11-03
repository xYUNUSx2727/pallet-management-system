import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_login import LoginManager

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()

app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "pallet-management-secret"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
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

# Ensure clean shutdown
@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()

with app.app_context():
    import models
    # Drop and recreate all tables
    db.drop_all()
    db.create_all()
    
    # Import seed data after tables are created
    from seed_data import seed_data
    seed_data()

from routes import *
