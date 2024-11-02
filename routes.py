from flask import render_template, request, jsonify, flash, redirect, url_for, send_file
from app import app, db
from models import Company, Pallet
from utils import calculate_component_volumes
from datetime import datetime
from sqlalchemy import func
import io
import csv

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

@app.route('/pallet/<int:pallet_id>')
def pallet_details(pallet_id):
    pallet = Pallet.query.get_or_404(pallet_id)
    return render_template('pallet_details.html', pallet=pallet)

@app.route('/dashboard')
def dashboard():
    stats = {
        'total_pallets': Pallet.query.count(),
        'total_companies': Company.query.count(),
        'avg_price': db.session.query(func.avg(Pallet.price)).scalar() or 0
    }

    # Calculate volume distribution
    volumes = db.session.query(Pallet.total_volume).all()
    volume_ranges = []
    volume_distribution = []
    
    if volumes:
        volumes = [v[0] for v in volumes if v[0] is not None]
        if volumes:
            min_vol, max_vol = min(volumes), max(volumes)
            range_size = (max_vol - min_vol) / 5 if max_vol > min_vol else 1
            volume_ranges = [
                f"{(min_vol + i*range_size):.1f} - {(min_vol + (i+1)*range_size):.1f}"
                for i in range(5)
            ]
            volume_distribution = [0] * 5
            for vol in volumes:
                idx = min(int((vol - min_vol) / range_size) if range_size else 0, 4)
                volume_distribution[idx] += 1

    # Calculate price distribution
    prices = db.session.query(Pallet.price).all()
    price_ranges = []
    price_distribution = []
    
    if prices:
        prices = [p[0] for p in prices if p[0] is not None]
        if prices:
            min_price, max_price = min(prices), max(prices)
            price_range_size = (max_price - min_price) / 5 if max_price > min_price else 1
            price_ranges = [
                f"{(min_price + i*price_range_size):.0f} - {(min_price + (i+1)*price_range_size):.0f} TL"
                for i in range(5)
            ]
            price_distribution = [0] * 5
            for price in prices:
                idx = min(int((price - min_price) / price_range_size) if price_range_size else 0, 4)
                price_distribution[idx] += 1

    # Company statistics
    companies = Company.query.all()
    company_stats = []
    company_names = []
    company_avg_prices = []
    company_avg_volumes = []

    for company in companies:
        company_names.append(company.name)
        pallets = company.pallets
        if pallets:
            valid_pallets = [p for p in pallets if p.price is not None and p.total_volume is not None]
            if valid_pallets:
                avg_price = sum(p.price for p in valid_pallets) / len(valid_pallets)
                avg_volume = sum(p.total_volume for p in valid_pallets) / len(valid_pallets)
                min_price = min(p.price for p in valid_pallets)
                max_price = max(p.price for p in valid_pallets)
            else:
                avg_price = avg_volume = min_price = max_price = 0
        else:
            avg_price = avg_volume = min_price = max_price = 0
            
        company_stats.append({
            'name': company.name,
            'pallet_count': len(pallets),
            'avg_price': avg_price,
            'avg_volume': avg_volume,
            'min_price': min_price,
            'max_price': max_price
        })
        company_avg_prices.append(avg_price)
        company_avg_volumes.append(avg_volume)

    return render_template('dashboard.html',
                         stats=stats,
                         volume_ranges=volume_ranges,
                         volume_distribution=volume_distribution,
                         price_ranges=price_ranges,
                         price_distribution=price_distribution,
                         companies=company_names,
                         company_avg_prices=company_avg_prices,
                         company_avg_volumes=company_avg_volumes,
                         company_stats=company_stats)

@app.route('/api/pallets', methods=['GET', 'POST'])
def handle_pallets():
    if request.method == 'POST':
        try:
            data = request.json
            if not data:
                return jsonify({'message': 'Geçersiz veri'}), 400
                
            pallet = Pallet(**data)
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes.get('upper_board_desi', 0)
            pallet.lower_board_desi = volumes.get('lower_board_desi', 0)
            pallet.closure_desi = volumes.get('closure_desi', 0)
            pallet.block_desi = volumes.get('block_desi', 0)
            pallet.total_volume = volumes.get('total_desi', 0)
            
            db.session.add(pallet)
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla oluşturuldu'}), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'Hata: {str(e)}'}), 400
    
    pallets = Pallet.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'company_id': p.company_id,
        'company_name': p.company.name,
        'price': p.price,
        'total_volume': p.total_volume or 0,
        'board_thickness': p.board_thickness,
        'upper_board_length': p.upper_board_length,
        'upper_board_width': p.upper_board_width,
        'upper_board_quantity': p.upper_board_quantity,
        'lower_board_length': p.lower_board_length,
        'lower_board_width': p.lower_board_width,
        'lower_board_quantity': p.lower_board_quantity,
        'closure_length': p.closure_length,
        'closure_width': p.closure_width,
        'closure_quantity': p.closure_quantity,
        'block_length': p.block_length,
        'block_width': p.block_width,
        'block_height': p.block_height
    } for p in pallets])

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_pallet(pallet_id):
    try:
        pallet = Pallet.query.get_or_404(pallet_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': pallet.id,
                'name': pallet.name,
                'company_id': pallet.company_id,
                'price': pallet.price,
                'board_thickness': pallet.board_thickness,
                'upper_board_length': pallet.upper_board_length,
                'upper_board_width': pallet.upper_board_width,
                'upper_board_quantity': pallet.upper_board_quantity,
                'lower_board_length': pallet.lower_board_length,
                'lower_board_width': pallet.lower_board_width,
                'lower_board_quantity': pallet.lower_board_quantity,
                'closure_length': pallet.closure_length,
                'closure_width': pallet.closure_width,
                'closure_quantity': pallet.closure_quantity,
                'block_length': pallet.block_length,
                'block_width': pallet.block_width,
                'block_height': pallet.block_height
            })
        
        elif request.method == 'PUT':
            data = request.json
            if not data:
                return jsonify({'message': 'Geçersiz veri'}), 400
                
            for key, value in data.items():
                if hasattr(pallet, key):
                    setattr(pallet, key, value)
            
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes.get('upper_board_desi', 0)
            pallet.lower_board_desi = volumes.get('lower_board_desi', 0)
            pallet.closure_desi = volumes.get('closure_desi', 0)
            pallet.block_desi = volumes.get('block_desi', 0)
            pallet.total_volume = volumes.get('total_desi', 0)
            
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla güncellendi'})
        
        elif request.method == 'DELETE':
            db.session.delete(pallet)
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla silindi'})
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Hata: {str(e)}'}), 400

@app.route('/export/pallets/csv')
def export_pallets_csv():
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['ID', 'İsim', 'Firma', 'Fiyat (TL)', 
                        'Üst Tahta Desi', 'Alt Tahta Desi', 
                        'Kapatma Desi', 'Takoz Desi (9 adet)', 'Toplam Desi'])
        
        pallets = Pallet.query.all()
        for pallet in pallets:
            writer.writerow([
                pallet.id, pallet.name, pallet.company.name, pallet.price,
                pallet.upper_board_desi, pallet.lower_board_desi,
                pallet.closure_desi, pallet.block_desi, pallet.total_volume
            ])
        
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'paletler_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({'message': f'Dışa aktarma hatası: {str(e)}'}), 500
