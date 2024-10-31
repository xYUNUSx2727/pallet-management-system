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

    # Top board dimensions
    top_length = db.Column(db.Float, nullable=False)
    top_width = db.Column(db.Float, nullable=False)
    top_height = db.Column(db.Float, nullable=False)

    # Bottom board dimensions
    bottom_length = db.Column(db.Float, nullable=False)
    bottom_width = db.Column(db.Float, nullable=False)
    bottom_height = db.Column(db.Float, nullable=False)

    # Chassis dimensions
    chassis_length = db.Column(db.Float, nullable=False)
    chassis_width = db.Column(db.Float, nullable=False)
    chassis_height = db.Column(db.Float, nullable=False)

    # Block dimensions (x9)
    block_length = db.Column(db.Float, nullable=False)
    block_width = db.Column(db.Float, nullable=False)
    block_height = db.Column(db.Float, nullable=False)

    # Total volume in cubic meters
    total_volume = db.Column(db.Float)

    def __repr__(self):
        return f'<Pallet {self.name}>'
