from app import db
from datetime import datetime

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    pallets = db.relationship('Pallet', backref='company', lazy=True, cascade="all, delete-orphan")

class Pallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('company.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    price = db.Column(db.Float, nullable=False, default=0.0)

    # Board dimensions (all measurements in cm)
    board_thickness = db.Column(db.Float, nullable=False)
    upper_board_length = db.Column(db.Float, nullable=False)
    upper_board_width = db.Column(db.Float, nullable=False)
    upper_board_quantity = db.Column(db.Integer, nullable=False)
    lower_board_length = db.Column(db.Float, nullable=False)
    lower_board_width = db.Column(db.Float, nullable=False)
    lower_board_quantity = db.Column(db.Integer, nullable=False)
    closure_length = db.Column(db.Float, nullable=False)
    closure_width = db.Column(db.Float, nullable=False)
    closure_quantity = db.Column(db.Integer, nullable=False)
    block_length = db.Column(db.Float, nullable=False)
    block_width = db.Column(db.Float, nullable=False)
    block_height = db.Column(db.Float, nullable=False)

    # Volume calculations in desi (1 desi = 1000 cm³)
    upper_board_desi = db.Column(db.Float)
    lower_board_desi = db.Column(db.Float)
    closure_desi = db.Column(db.Float)
    block_desi = db.Column(db.Float)
    total_volume = db.Column(db.Float)

    def __repr__(self):
        return f'<Palet {self.name}>'
