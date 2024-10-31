from flask import render_template, request, jsonify, flash, redirect, url_for
from app import app, db
from models import Company, Pallet, InventoryTransaction
from utils import calculate_pallet_volume
from datetime import datetime

@app.route('/')
def index():
    return redirect(url_for('companies'))

@app.route('/companies')
def companies():
    companies = Company.query.all()
    return render_template('companies.html', companies=companies)

@app.route('/pallets')
def pallets():
    pallets = Pallet.query.all()
    companies = Company.query.all()
    return render_template('pallets.html', pallets=pallets, companies=companies)

@app.route('/pallets/<int:pallet_id>')
def pallet_details(pallet_id):
    pallet = Pallet.query.get_or_404(pallet_id)
    return render_template('pallet_details.html', pallet=pallet)

@app.route('/api/inventory/<int:pallet_id>', methods=['POST'])
def update_inventory(pallet_id):
    pallet = Pallet.query.get_or_404(pallet_id)
    data = request.json
    
    transaction = InventoryTransaction(
        pallet_id=pallet_id,
        transaction_type=data['type'],
        quantity=data['quantity'],
        notes=data.get('notes', '')
    )
    
    if data['type'] == 'IN':
        new_stock = pallet.current_stock + data['quantity']
        if pallet.max_stock_level > 0 and new_stock > pallet.max_stock_level:
            return jsonify({'error': 'Exceeds maximum stock level'}), 400
        pallet.current_stock = new_stock
    else:  # OUT
        new_stock = pallet.current_stock - data['quantity']
        if new_stock < 0:
            return jsonify({'error': 'Insufficient stock'}), 400
        pallet.current_stock = new_stock
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Inventory updated successfully',
        'current_stock': pallet.current_stock
    })

@app.route('/api/inventory/<int:pallet_id>/history')
def inventory_history(pallet_id):
    transactions = InventoryTransaction.query.filter_by(pallet_id=pallet_id)\
        .order_by(InventoryTransaction.transaction_date.desc()).all()
    return jsonify([{
        'id': t.id,
        'type': t.transaction_type,
        'quantity': t.quantity,
        'date': t.transaction_date.strftime('%Y-%m-%d %H:%M:%S'),
        'notes': t.notes
    } for t in transactions])

# API Routes for Companies
@app.route('/api/companies', methods=['GET', 'POST'])
def handle_companies():
    if request.method == 'POST':
        data = request.json
        company = Company(
            name=data['name'],
            contact_email=data['contact_email']
        )
        db.session.add(company)
        db.session.commit()
        return jsonify({'message': 'Company created successfully'}), 201
    
    companies = Company.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'contact_email': c.contact_email
    } for c in companies])

@app.route('/api/companies/<int:company_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_company(company_id):
    company = Company.query.get_or_404(company_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': company.id,
            'name': company.name,
            'contact_email': company.contact_email
        })
    
    elif request.method == 'PUT':
        data = request.json
        company.name = data['name']
        company.contact_email = data['contact_email']
        db.session.commit()
        return jsonify({'message': 'Company updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(company)
        db.session.commit()
        return jsonify({'message': 'Company deleted successfully'})

# API Routes for Pallets
@app.route('/api/pallets', methods=['GET', 'POST'])
def handle_pallets():
    if request.method == 'POST':
        data = request.json
        pallet = Pallet(
            name=data['name'],
            company_id=data['company_id'],
            current_stock=data.get('current_stock', 0),
            min_stock_level=data.get('min_stock_level', 0),
            max_stock_level=data.get('max_stock_level', 0),
            location=data.get('location', ''),
            top_length=data['top_length'],
            top_width=data['top_width'],
            top_height=data['top_height'],
            bottom_length=data['bottom_length'],
            bottom_width=data['bottom_width'],
            bottom_height=data['bottom_height'],
            chassis_length=data['chassis_length'],
            chassis_width=data['chassis_width'],
            chassis_height=data['chassis_height'],
            block_length=data['block_length'],
            block_width=data['block_width'],
            block_height=data['block_height']
        )
        pallet.total_volume = calculate_pallet_volume(pallet)
        db.session.add(pallet)
        db.session.commit()
        return jsonify({'message': 'Pallet created successfully'}), 201
    
    pallets = Pallet.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'company_id': p.company_id,
        'company_name': p.company.name,
        'current_stock': p.current_stock,
        'min_stock_level': p.min_stock_level,
        'max_stock_level': p.max_stock_level,
        'location': p.location,
        'total_volume': p.total_volume,
        'top_length': p.top_length,
        'top_width': p.top_width,
        'top_height': p.top_height,
        'bottom_length': p.bottom_length,
        'bottom_width': p.bottom_width,
        'bottom_height': p.bottom_height,
        'chassis_length': p.chassis_length,
        'chassis_width': p.chassis_width,
        'chassis_height': p.chassis_height,
        'block_length': p.block_length,
        'block_width': p.block_width,
        'block_height': p.block_height
    } for p in pallets])

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_pallet(pallet_id):
    pallet = Pallet.query.get_or_404(pallet_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': pallet.id,
            'name': pallet.name,
            'company_id': pallet.company_id,
            'company_name': pallet.company.name,
            'current_stock': pallet.current_stock,
            'min_stock_level': pallet.min_stock_level,
            'max_stock_level': pallet.max_stock_level,
            'location': pallet.location,
            'total_volume': pallet.total_volume,
            'top_length': pallet.top_length,
            'top_width': pallet.top_width,
            'top_height': pallet.top_height,
            'bottom_length': pallet.bottom_length,
            'bottom_width': pallet.bottom_width,
            'bottom_height': pallet.bottom_height,
            'chassis_length': pallet.chassis_length,
            'chassis_width': pallet.chassis_width,
            'chassis_height': pallet.chassis_height,
            'block_length': pallet.block_length,
            'block_width': pallet.block_width,
            'block_height': pallet.block_height
        })
    
    elif request.method == 'PUT':
        data = request.json
        for key, value in data.items():
            setattr(pallet, key, value)
        pallet.total_volume = calculate_pallet_volume(pallet)
        db.session.commit()
        return jsonify({'message': 'Pallet updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(pallet)
        db.session.commit()
        return jsonify({'message': 'Pallet deleted successfully'})
