import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "pallet-management-secret"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

with app.app_context():
    import models
    # Drop all tables with CASCADE
    db.session.execute(db.text('DROP TABLE IF EXISTS inventory_transaction CASCADE'))
    db.session.execute(db.text('DROP TABLE IF EXISTS pallet CASCADE'))
    db.session.execute(db.text('DROP TABLE IF EXISTS company CASCADE'))
    db.session.commit()
    # Create all tables with new schema
    db.create_all()

from routes import *
