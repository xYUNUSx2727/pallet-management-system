from flask import render_template, request, jsonify, flash, redirect, url_for, send_file
from app import app, db
from models import Company, Pallet, User
from utils import calculate_component_volumes
from datetime import datetime
from sqlalchemy import func
import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from flask_login import login_user, login_required, logout_user, current_user

pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('companies'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('Başarıyla giriş yaptınız!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page if next_page else url_for('companies'))
        else:
            flash('Geçersiz kullanıcı adı veya şifre', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('companies'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor', 'danger')
            return render_template('register.html')
            
        if User.query.filter_by(username=username).first():
            flash('Bu kullanıcı adı zaten kullanılıyor', 'danger')
            return render_template('register.html')
            
        if User.query.filter_by(email=email).first():
            flash('Bu e-posta adresi zaten kullanılıyor', 'danger')
            return render_template('register.html')
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Başarıyla çıkış yaptınız', 'success')
    return redirect(url_for('login'))

@app.route('/')
def index():
    return redirect(url_for('companies'))

@app.route('/companies')
@login_required
def companies():
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('companies.html', companies=companies)

@app.route('/pallets')
@login_required
def pallets():
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('pallets.html', pallets=pallets, companies=companies)

@app.route('/pallets/<int:pallet_id>')
@login_required
def pallet_details(pallet_id):
    pallet = Pallet.query.join(Company).filter(
        Company.user_id == current_user.id,
        Pallet.id == pallet_id
    ).first_or_404()
    return render_template('pallet_details.html', pallet=pallet)

@app.route('/dashboard')
@login_required
def dashboard():
    # Query only current user's data
    user_companies = Company.query.filter_by(user_id=current_user.id)
    user_pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id)

    stats = {
        'total_pallets': user_pallets.count(),
        'total_companies': user_companies.count(),
        'avg_price': db.session.query(func.avg(Pallet.price)).join(Company).filter(
            Company.user_id == current_user.id
        ).scalar() or 0
    }

    volumes = db.session.query(Pallet.total_volume).join(Company).filter(
        Company.user_id == current_user.id
    ).all()
    if volumes:
        volumes = [v[0] for v in volumes if v[0] is not None]
        min_vol, max_vol = min(volumes), max(volumes)
        range_size = (max_vol - min_vol) / 5 if max_vol > min_vol else 1
        
        volume_ranges = [
            f"{(min_vol + i*range_size):.1f} - {(min_vol + (i+1)*range_size):.1f}"
            for i in range(5)
        ]
        
        volume_distribution = [0] * 5
        for vol in volumes:
            idx = min(int((vol - min_vol) / range_size), 4)
            volume_distribution[idx] += 1
    else:
        volume_ranges = []
        volume_distribution = []

    prices = db.session.query(Pallet.price).join(Company).filter(
        Company.user_id == current_user.id
    ).all()
    if prices:
        prices = [p[0] for p in prices if p[0] is not None]
        min_price, max_price = min(prices), max(prices)
        price_range_size = (max_price - min_price) / 5 if max_price > min_price else 1
        
        price_ranges = [
            f"{(min_price + i*price_range_size):.0f} - {(min_price + (i+1)*price_range_size):.0f} TL"
            for i in range(5)
        ]
        
        price_distribution = [0] * 5
        for price in prices:
            idx = min(int((price - min_price) / price_range_size), 4)
            price_distribution[idx] += 1
    else:
        price_ranges = []
        price_distribution = []

    companies = db.session.query(Company.name).filter_by(user_id=current_user.id).all()
    companies = [c[0] for c in companies]
    
    company_stats = []
    for company in user_companies.all():
        pallets = company.pallets
        if pallets:
            avg_price = sum(p.price for p in pallets) / len(pallets)
            avg_volume = sum(p.total_volume for p in pallets if p.total_volume) / len(pallets)
            min_price = min(p.price for p in pallets)
            max_price = max(p.price for p in pallets)
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
    
    company_avg_prices = [stat['avg_price'] for stat in company_stats]
    company_avg_volumes = [stat['avg_volume'] for stat in company_stats]

    return render_template('dashboard.html',
                         stats=stats,
                         volume_ranges=volume_ranges,
                         volume_distribution=volume_distribution,
                         price_ranges=price_ranges,
                         price_distribution=price_distribution,
                         companies=companies,
                         company_avg_prices=company_avg_prices,
                         company_avg_volumes=company_avg_volumes,
                         company_stats=company_stats)

@app.route('/export/pallets/csv')
@login_required
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
    
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
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
@login_required
def export_pallets_pdf():
    company_id = request.args.get('company_id', '')
    min_price = request.args.get('min_price', type=float, default=0)
    max_price = request.args.get('max_price', type=float)
    search_term = request.args.get('search', '').lower()

    query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
    if company_id:
        query = query.filter(Pallet.company_id == company_id)
    if min_price is not None:
        query = query.filter(Pallet.price >= min_price)
    if max_price is not None:
        query = query.filter(Pallet.price <= max_price)
    if search_term:
        query = query.filter(Pallet.name.ilike(f'%{search_term}%'))

    pallets = query.all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm
    )
    
    available_width = 27.7*cm
    
    col_widths = [
        1.5*cm,    # ID
        3*cm,      # İsim
        3*cm,      # Firma
        2*cm,      # Fiyat
        2*cm,      # Hacim
        4.05*cm,   # Üst Tahta
        4.05*cm,   # Alt Tahta
        4.05*cm,   # Kapatma
        2*cm,      # Takoz
        2.05*cm    # Desi
    ]
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='TableHeader',
        parent=styles['Normal'],
        fontName='DejaVuSans-Bold',
        fontSize=8,
        textColor=colors.whitesmoke,
        alignment=1,
        spaceAfter=8,
        spaceBefore=8
    ))
    
    styles.add(ParagraphStyle(
        name='TableCell',
        parent=styles['Normal'],
        fontName='DejaVuSans',
        fontSize=7,
        leading=8,
        spaceBefore=2,
        spaceAfter=2
    ))
    
    elements = []
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontName='DejaVuSans-Bold',
        fontSize=20,
        spaceAfter=30,
        alignment=1
    )

    company_name = None
    if company_id:
        company = Company.query.get(company_id)
        if company and company.user_id == current_user.id:
            company_name = company.name

    title = f"{company_name} Palet Ölçüleri" if company_name else "Palet Ölçüleri"
    elements.append(Paragraph(title, title_style))
    
    elements.append(Paragraph(
        f"Oluşturma Tarihi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        ParagraphStyle('Date', parent=styles['Normal'], fontName='DejaVuSans', alignment=1, spaceAfter=20)
    ))
    
    headers = [
        'ID',
        'İsim',
        'Firma',
        'Fiyat (TL)',
        'Hacim (desi)',
        'Üst Tahta\nÖlçüleri',
        'Alt Tahta\nÖlçüleri',
        'Kapatma\nÖlçüleri',
        'Takoz\nÖlçüleri',
        'Desi\nHesapları'
    ]
    
    data = [[Paragraph(header, styles['TableHeader']) for header in headers]]
    
    for pallet in pallets:
        volumes = calculate_component_volumes(pallet)
        
        upper_boards = (
            f"Kalınlık: {pallet.board_thickness} cm\n"
            f"Uzunluk: {pallet.upper_board_length} cm\n"
            f"Genişlik: {pallet.upper_board_width} cm\n"
            f"Adet: {pallet.upper_board_quantity}"
        )
        
        lower_boards = (
            f"Kalınlık: {pallet.board_thickness} cm\n"
            f"Uzunluk: {pallet.lower_board_length} cm\n"
            f"Genişlik: {pallet.lower_board_width} cm\n"
            f"Adet: {pallet.lower_board_quantity}"
        )
        
        closure_boards = (
            f"Kalınlık: {pallet.board_thickness} cm\n"
            f"Uzunluk: {pallet.closure_length} cm\n"
            f"Genişlik: {pallet.closure_width} cm\n"
            f"Adet: {pallet.closure_quantity}"
        )
        
        blocks = (
            f"Uzunluk: {pallet.block_length} cm\n"
            f"Genişlik: {pallet.block_width} cm\n"
            f"Yükseklik: {pallet.block_height} cm"
        )
        
        desi_details = (
            f"Üst Tahta: {volumes['upper_board_desi']}\n"
            f"Alt Tahta: {volumes['lower_board_desi']}\n"
            f"Kapatma: {volumes['closure_desi']}\n"
            f"Takoz: {volumes['block_desi']}\n"
            f"Toplam: {volumes['total_desi']}"
        )
        
        row = [
            Paragraph(str(pallet.id), styles['TableCell']),
            Paragraph(pallet.name, styles['TableCell']),
            Paragraph(pallet.company.name, styles['TableCell']),
            Paragraph(f"{pallet.price:.2f}", styles['TableCell']),
            Paragraph(f"{pallet.total_volume}", styles['TableCell']),
            Paragraph(upper_boards, styles['TableCell']),
            Paragraph(lower_boards, styles['TableCell']),
            Paragraph(closure_boards, styles['TableCell']),
            Paragraph(blocks, styles['TableCell']),
            Paragraph(desi_details, styles['TableCell'])
        ]
        data.append(row)
    
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2196F3')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, -1), 'DejaVuSans'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (-1, 1), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
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
@login_required
def handle_companies():
    if request.method == 'POST':
        data = request.json
        company = Company(
            name=data['name'],
            contact_email=data['contact_email'],
            user_id=current_user.id
        )
        db.session.add(company)
        db.session.commit()
        return jsonify({'message': 'Firma başarıyla oluşturuldu'}), 201
    
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'contact_email': c.contact_email
    } for c in companies])

@app.route('/api/companies/<int:company_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def handle_company(company_id):
    company = Company.query.filter_by(id=company_id, user_id=current_user.id).first_or_404()
    
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
@login_required
def handle_pallets():
    if request.method == 'POST':
        data = request.json
        
        # Verify company belongs to current user
        company = Company.query.filter_by(id=data['company_id'], user_id=current_user.id).first_or_404()
        
        pallet = Pallet(
            name=data['name'],
            company_id=company.id,
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
        
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.add(pallet)
        db.session.commit()
        return jsonify({'message': 'Palet başarıyla oluşturuldu'}), 201
    
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
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
@login_required
def handle_pallet(pallet_id):
    pallet = Pallet.query.join(Company).filter(
        Company.user_id == current_user.id,
        Pallet.id == pallet_id
    ).first_or_404()
    
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
            'block_height': pallet.block_height,
            'total_volume': pallet.total_volume
        })
    
    elif request.method == 'PUT':
        data = request.json
        
        # Verify new company belongs to current user if company_id is being updated
        if 'company_id' in data:
            company = Company.query.filter_by(id=data['company_id'], user_id=current_user.id).first_or_404()
            
        for key, value in data.items():
            setattr(pallet, key, value)
        
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

@app.route('/api/pallets/update-desi', methods=['POST'])
@login_required
def update_all_pallets_desi():
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    for pallet in pallets:
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
    
    db.session.commit()
    return jsonify({'message': 'Tüm paletlerin desi değerleri güncellendi'})
