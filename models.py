from app import db
from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.VARCHAR(80), unique=True, nullable=False)
    email = db.Column(db.VARCHAR(120), unique=True, nullable=False)
    password_hash = db.Column(db.VARCHAR(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    companies = db.relationship('Company', backref='owner', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(100), nullable=False)
    contact_email = db.Column(db.VARCHAR(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pallets = db.relationship('Pallet', backref='company', lazy=True, cascade="all, delete-orphan")

class Pallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    price = db.Column(db.DECIMAL(10, 2), nullable=False, default=0.0)

    # Board dimensions (all measurements in cm)
    board_thickness = db.Column(db.DECIMAL(10, 2), nullable=False)
    upper_board_length = db.Column(db.DECIMAL(10, 2), nullable=False)
    upper_board_width = db.Column(db.DECIMAL(10, 2), nullable=False)
    upper_board_quantity = db.Column(db.Integer, nullable=False)
    lower_board_length = db.Column(db.DECIMAL(10, 2), nullable=False)
    lower_board_width = db.Column(db.DECIMAL(10, 2), nullable=False)
    lower_board_quantity = db.Column(db.Integer, nullable=False)
    closure_length = db.Column(db.DECIMAL(10, 2), nullable=False)
    closure_width = db.Column(db.DECIMAL(10, 2), nullable=False)
    closure_quantity = db.Column(db.Integer, nullable=False)
    block_length = db.Column(db.DECIMAL(10, 2), nullable=False)
    block_width = db.Column(db.DECIMAL(10, 2), nullable=False)
    block_height = db.Column(db.DECIMAL(10, 2), nullable=False)

    # Volume calculations in desi (1 desi = 1000 cm³)
    upper_board_desi = db.Column(db.DECIMAL(10, 2))
    lower_board_desi = db.Column(db.DECIMAL(10, 2))
    closure_desi = db.Column(db.DECIMAL(10, 2))
    block_desi = db.Column(db.DECIMAL(10, 2))
    total_volume = db.Column(db.DECIMAL(10, 2))

    def __repr__(self):
        return f'<Palet {self.name}>'
