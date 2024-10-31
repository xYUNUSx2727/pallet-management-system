from flask import render_template, request, jsonify, flash, redirect, url_for, send_file
from app import app, db
from models import Company, Pallet
from utils import calculate_component_volumes
from datetime import datetime
import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

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

@app.route('/export/pallets/csv')
def export_pallets_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['ID', 'İsim', 'Firma', 'Fiyat (TL)', 
                    'Üst Tahta Desi', 'Alt Tahta Desi', 
                    'Kapatma Desi', 'Takoz Desi (9 adet)', 'Toplam Desi',
                    'Tahta Kalınlığı (cm)', 'Üst Tahta Uzunluğu (cm)', 
                    'Üst Tahta Genişliği (cm)', 'Üst Tahta Adedi',
                    'Alt Tahta Uzunluğu (cm)', 'Alt Tahta Genişliği (cm)', 
                    'Alt Tahta Adedi', 'Kapatma Uzunluğu (cm)', 
                    'Kapatma Genişliği (cm)', 'Kapatma Adedi',
                    'Takoz Uzunluğu (cm)', 'Takoz Genişliği (cm)', 
                    'Takoz Yüksekliği (cm)'])
    
    pallets = Pallet.query.all()
    for pallet in pallets:
        volumes = calculate_component_volumes(pallet)
        writer.writerow([
            pallet.id, pallet.name, pallet.company.name, pallet.price,
            volumes['upper_board_desi'], volumes['lower_board_desi'],
            volumes['closure_desi'], volumes['block_desi'], volumes['total_desi'],
            pallet.board_thickness, pallet.upper_board_length,
            pallet.upper_board_width, pallet.upper_board_quantity,
            pallet.lower_board_length, pallet.lower_board_width,
            pallet.lower_board_quantity, pallet.closure_length,
            pallet.closure_width, pallet.closure_quantity,
            pallet.block_length, pallet.block_width, pallet.block_height
        ])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'paletler_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@app.route('/export/pallets/pdf')
def export_pallets_pdf():
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    elements.append(Paragraph("Palet Yönetim Sistemi - Dışa Aktarım", styles['Title']))
    elements.append(Paragraph(f"Oluşturma Tarihi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    
    data = [['ID', 'İsim', 'Firma', 'Fiyat (TL)', 'Desi Hesapları']]
    pallets = Pallet.query.all()
    for pallet in pallets:
        volumes = calculate_component_volumes(pallet)
        desi_details = (
            f"Üst Tahta: {volumes['upper_board_desi']}\n"
            f"Alt Tahta: {volumes['lower_board_desi']}\n"
            f"Kapatma: {volumes['closure_desi']}\n"
            f"Takoz (9): {volumes['block_desi']}\n"
            f"Toplam: {volumes['total_desi']}"
        )
        data.append([
            str(pallet.id),
            pallet.name,
            pallet.company.name,
            f"{pallet.price:.2f}",
            desi_details
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196F3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (4, 1), (4, -1), 'LEFT'),
        ('TEXTCOLOR', (4, 1), (4, -1), colors.black),
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'paletler_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )

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
        return jsonify({'message': 'Firma başarıyla oluşturuldu'}), 201
    
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
        return jsonify({'message': 'Firma başarıyla güncellendi'})
    
    elif request.method == 'DELETE':
        db.session.delete(company)
        db.session.commit()
        return jsonify({'message': 'Firma başarıyla silindi'})

@app.route('/api/pallets', methods=['GET', 'POST'])
def handle_pallets():
    if request.method == 'POST':
        data = request.json
        pallet = Pallet(
            name=data['name'],
            company_id=data['company_id'],
            board_thickness=data['board_thickness'],
            upper_board_length=data['upper_board_length'],
            upper_board_width=data['upper_board_width'],
            upper_board_quantity=data['upper_board_quantity'],
            lower_board_length=data['lower_board_length'],
            lower_board_width=data['lower_board_width'],
            lower_board_quantity=data['lower_board_quantity'],
            closure_length=data['closure_length'],
            closure_width=data['closure_width'],
            closure_quantity=data['closure_quantity'],
            block_length=data['block_length'],
            block_width=data['block_width'],
            block_height=data['block_height'],
            price=data.get('price', 0)
        )
        
        # Calculate and save volumes
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.add(pallet)
        db.session.commit()
        return jsonify({'message': 'Palet başarıyla oluşturuldu'}), 201
    
    pallets = Pallet.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'company_id': p.company_id,
        'company_name': p.company.name,
        'price': p.price,
        'total_volume': p.total_volume,
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
    pallet = Pallet.query.get_or_404(pallet_id)
    
    if request.method == 'GET':
        return jsonify({
            'id': pallet.id,
            'name': pallet.name,
            'company_id': pallet.company_id,
            'company_name': pallet.company.name,
            'price': pallet.price,
            'total_volume': pallet.total_volume,
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
        for key, value in data.items():
            setattr(pallet, key, value)
        
        # Calculate and save volumes
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.commit()
        return jsonify({'message': 'Palet başarıyla güncellendi'})
    
    elif request.method == 'DELETE':
        db.session.delete(pallet)
        db.session.commit()
        return jsonify({'message': 'Palet başarıyla silindi'})

# Route to update desi values for all existing pallets
@app.route('/api/pallets/update-desi', methods=['POST'])
def update_all_pallets_desi():
    pallets = Pallet.query.all()
    for pallet in pallets:
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
    
    db.session.commit()
    return jsonify({'message': 'Tüm paletlerin desi değerleri güncellendi'})
