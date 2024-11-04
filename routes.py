from flask import render_template, request, jsonify, flash, redirect, url_for, send_file, abort
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
from functools import wraps

pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Bu sayfaya erişmek için giriş yapmalısınız.', 'warning')
            return redirect(url_for('login', next=request.url))
        if not current_user.is_admin:
            flash('Bu sayfaya erişim yetkiniz bulunmamaktadır.', 'danger')
            return abort(403)
        return f(*args, **kwargs)
    return decorated_function

def owner_required(model):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('Bu işlem için giriş yapmalısınız.', 'warning')
                return jsonify({'message': 'Yetkisiz erişim'}), 401
            
            item_id = kwargs.get('company_id') or kwargs.get('pallet_id')
            if not item_id:
                return jsonify({'message': 'Geçersiz istek'}), 400
                
            item = model.query.get(item_id)
            if not item:
                return jsonify({'message': 'Kayıt bulunamadı'}), 404
                
            if model == Company and item.user_id != current_user.id:
                return jsonify({'message': 'Yetkisiz erişim'}), 403
                
            if model == Pallet and item.company.user_id != current_user.id:
                return jsonify({'message': 'Yetkisiz erişim'}), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=remember)
            flash('Başarıyla giriş yaptınız!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page if next_page and next_page.startswith('/') else url_for('dashboard'))
        else:
            flash('Geçersiz kullanıcı adı veya şifre', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        try:
            username = request.form.get('username')
            email = request.form.get('email')
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            if not username or not email or not password or not confirm_password:
                flash('Tüm alanları doldurun', 'danger')
                return render_template('register.html')
            
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
        except Exception as e:
            db.session.rollback()
            flash('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'danger')
            return render_template('register.html')
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Başarıyla çıkış yaptınız', 'success')
    return redirect(url_for('login'))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/companies')
@login_required
def companies():
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('companies.html', companies=companies)

@app.route('/api/companies', methods=['POST'])
@login_required
def create_company():
    try:
        data = request.get_json()
        company = Company(
            name=data['name'],
            contact_email=data['contact_email'],
            user_id=current_user.id
        )
        db.session.add(company)
        db.session.commit()
        return jsonify({'message': 'Firma başarıyla eklendi', 'id': company.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/api/companies/<int:company_id>', methods=['PUT', 'DELETE', 'GET'])
@login_required
@owner_required(Company)
def manage_company(company_id):
    company = Company.query.filter_by(id=company_id, user_id=current_user.id).first()
    if not company:
        return jsonify({'message': 'Firma bulunamadı'}), 404
        
    if request.method == 'GET':
        return jsonify({
            'id': company.id,
            'name': company.name,
            'contact_email': company.contact_email
        })
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            company.name = data['name']
            company.contact_email = data['contact_email']
            db.session.commit()
            return jsonify({'message': 'Firma başarıyla güncellendi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400
    else:  # DELETE
        try:
            db.session.delete(company)
            db.session.commit()
            return jsonify({'message': 'Firma başarıyla silindi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400

@app.route('/pallets')
@login_required
def pallets():
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('pallets.html', pallets=pallets, companies=companies)

@app.route('/pallets/<int:pallet_id>')
@login_required
@owner_required(Pallet)
def pallet_details(pallet_id):
    pallet = Pallet.query.join(Company).filter(
        Company.user_id == current_user.id,
        Pallet.id == pallet_id
    ).first_or_404()
    return render_template('pallet_details.html', pallet=pallet)

@app.route('/api/pallets', methods=['POST'])
@login_required
def create_pallet():
    try:
        data = request.get_json()
        
        # Verify company ownership
        company = Company.query.filter_by(id=data.get('company_id'), user_id=current_user.id).first()
        if not company:
            return jsonify({'message': 'Geçersiz firma'}), 404
        
        pallet = Pallet(
            name=data['name'],
            company_id=company.id,
            price=data['price'],
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
            block_height=data['block_height']
        )
        
        # Calculate volumes
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.add(pallet)
        db.session.commit()
        return jsonify({'message': 'Palet başarıyla eklendi', 'id': pallet.id}), 201
    except KeyError as e:
        return jsonify({'message': f'Eksik alan: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
@owner_required(Pallet)
def manage_pallet(pallet_id):
    try:
        pallet = Pallet.query.join(Company).filter(
            Pallet.id == pallet_id,
            Company.user_id == current_user.id
        ).first()
        
        if not pallet:
            return jsonify({'message': 'Palet bulunamadı'}), 404

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
                'block_height': pallet.block_height,
            })
        elif request.method == 'PUT':
            data = request.get_json()
            
            # Verify company ownership
            company = Company.query.filter_by(id=data.get('company_id'), user_id=current_user.id).first()
            if not company:
                return jsonify({'message': 'Geçersiz firma'}), 404
            
            # Update pallet fields
            for key, value in data.items():
                setattr(pallet, key, value)
            
            # Recalculate volumes
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes['upper_board_desi']
            pallet.lower_board_desi = volumes['lower_board_desi']
            pallet.closure_desi = volumes['closure_desi']
            pallet.block_desi = volumes['block_desi']
            pallet.total_volume = volumes['total_desi']
            
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla güncellendi'})
        else:  # DELETE
            db.session.delete(pallet)
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla silindi'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@app.route('/export/pallets/csv')
@login_required
def export_pallets_csv():
    # Get filter parameters
    company_id = request.args.get('company_id', '')
    min_price = request.args.get('min_price', type=float, default=0)
    max_price = request.args.get('max_price', type=float)
    search_term = request.args.get('search', '').lower()

    # Build query with filters
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

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow([
        'ID', 'İsim', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
        'Tahta Kalınlığı', 
        'Üst Tahta (UxGxA)', 'Alt Tahta (UxGxA)', 
        'Kapama (UxGxA)', 'Takoz (UxGxY)'
    ])
    
    # Write data
    for pallet in pallets:
        writer.writerow([
            pallet.id, pallet.name, pallet.company.name, 
            f"{pallet.price:.2f}", f"{pallet.total_volume:.2f}",
            pallet.board_thickness,
            f"{pallet.upper_board_length}x{pallet.upper_board_width}x{pallet.upper_board_quantity}",
            f"{pallet.lower_board_length}x{pallet.lower_board_width}x{pallet.lower_board_quantity}",
            f"{pallet.closure_length}x{pallet.closure_width}x{pallet.closure_quantity}",
            f"{pallet.block_length}x{pallet.block_width}x{pallet.block_height}"
        ])
    
    # Prepare response
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'paletler_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )

@app.route('/export/pallets/pdf')
@login_required
def export_pallets_pdf():
    # Get filter parameters
    company_id = request.args.get('company_id', '')
    min_price = request.args.get('min_price', type=float, default=0)
    max_price = request.args.get('max_price', type=float)
    search_term = request.args.get('search', '').lower()

    # Build query with filters
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

    # Create PDF in memory
    buffer = io.BytesIO()
    
    # Get company name if single company selected
    company_name = None
    if company_id:
        company = Company.query.get(company_id)
        if company:
            company_name = company.name

    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=1*cm,
        leftMargin=1*cm,
        topMargin=1*cm,
        bottomMargin=1*cm
    )

    # Create elements list
    elements = []

    # Add title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=getSampleStyleSheet()['Title'],
        fontName='DejaVuSans-Bold',
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )

    title_text = 'Palet Listesi'
    if company_name:
        title_text += f' - {company_name}'
    if min_price or max_price:
        price_range = []
        if min_price:
            price_range.append(f'{min_price:.2f} TL')
        if max_price:
            price_range.append(f'{max_price:.2f} TL')
        title_text += f' (Fiyat Aralığı: {" - ".join(price_range)})'
    
    elements.append(Paragraph(title_text, title_style))

    # Define table data
    table_data = [
        ['ID', 'İsim', 'Firma', 'Fiyat (TL)', 'Hacim (desi)', 'Ölçüler']
    ]

    for pallet in pallets:
        measurements = f"""Kalınlık: {pallet.board_thickness}
        Üst Tahta: {pallet.upper_board_length}x{pallet.upper_board_width}x{pallet.upper_board_quantity}
        Alt Tahta: {pallet.lower_board_length}x{pallet.lower_board_width}x{pallet.lower_board_quantity}
        Kapama: {pallet.closure_length}x{pallet.closure_width}x{pallet.closure_quantity}
        Takoz: {pallet.block_length}x{pallet.block_width}x{pallet.block_height}"""

        table_data.append([
            str(pallet.id),
            pallet.name,
            pallet.company.name,
            f"{pallet.price:.2f}",
            f"{pallet.total_volume:.2f}",
            measurements
        ])

    # Create table
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'DejaVuSans'),
        ('FONT', (0, 0), (-1, 0), 'DejaVuSans-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BOX', (0, 0), (-1, -1), 2, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2a2e35')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
    ]))

    elements.append(table)

    # Build PDF
    doc.build(elements)

    # Prepare response
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'paletler_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    )
