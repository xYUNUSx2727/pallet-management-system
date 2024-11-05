from flask import render_template, redirect, url_for, flash, request, jsonify, send_file
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Company, Pallet
from utils import calculate_component_volumes
from werkzeug.security import generate_password_hash
import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

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
            return redirect(url_for('dashboard'))
        
        flash('Geçersiz kullanıcı adı veya şifre', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Şifreler eşleşmiyor', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(username=username).first():
            flash('Bu kullanıcı adı zaten kullanılıyor', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('Bu e-posta adresi zaten kullanılıyor', 'danger')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Hesabınız başarıyla oluşturuldu', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/companies')
@login_required
def companies():
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('companies.html', companies=companies)

@app.route('/api/companies', methods=['POST'])
@login_required
def add_company():
    data = request.get_json()
    
    company = Company(
        name=data['name'],
        contact_email=data['contact_email'],
        user_id=current_user.id
    )
    
    db.session.add(company)
    db.session.commit()
    
    return jsonify({'message': 'Company added successfully'})

@app.route('/api/companies/<int:company_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_company(company_id):
    company = Company.query.get_or_404(company_id)
    
    if company.user_id != current_user.id:
        return jsonify({'message': 'Unauthorized'}), 403
    
    if request.method == 'GET':
        return jsonify({
            'id': company.id,
            'name': company.name,
            'contact_email': company.contact_email
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        company.name = data['name']
        company.contact_email = data['contact_email']
        db.session.commit()
        return jsonify({'message': 'Company updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(company)
        db.session.commit()
        return jsonify({'message': 'Company deleted successfully'})

@app.route('/pallets')
@login_required
def pallets():
    search_term = request.args.get('search', '')
    company_id = request.args.get('company_id', type=int)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
    
    if search_term:
        query = query.filter(Pallet.name.like(f'%{search_term}%'))
    if company_id:
        query = query.filter(Pallet.company_id == company_id)
    if min_price is not None:
        query = query.filter(Pallet.price >= min_price)
    if max_price is not None:
        query = query.filter(Pallet.price <= max_price)
    
    pallets = query.all()
    companies = Company.query.filter_by(user_id=current_user.id).all()
    
    return render_template('pallets.html', pallets=pallets, companies=companies)

@app.route('/api/pallets', methods=['POST'])
@login_required
def add_pallet():
    try:
        data = request.get_json()
        company = Company.query.get_or_404(data['company_id'])
        
        if company.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        pallet = Pallet(**data)
        volumes = calculate_component_volumes(pallet)
        
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.add(pallet)
        db.session.commit()
        
        return jsonify({'message': 'Pallet added successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 400

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_pallet(pallet_id):
    pallet = Pallet.query.join(Company).filter(
        Pallet.id == pallet_id,
        Company.user_id == current_user.id
    ).first_or_404()
    
    if request.method == 'GET':
        return jsonify({
            'id': pallet.id,
            'name': pallet.name,
            'company_id': pallet.company_id,
            'price': float(pallet.price),
            'board_thickness': float(pallet.board_thickness),
            'upper_board_length': float(pallet.upper_board_length),
            'upper_board_width': float(pallet.upper_board_width),
            'upper_board_quantity': pallet.upper_board_quantity,
            'lower_board_length': float(pallet.lower_board_length),
            'lower_board_width': float(pallet.lower_board_width),
            'lower_board_quantity': pallet.lower_board_quantity,
            'closure_length': float(pallet.closure_length),
            'closure_width': float(pallet.closure_width),
            'closure_quantity': pallet.closure_quantity,
            'block_length': float(pallet.block_length),
            'block_width': float(pallet.block_width),
            'block_height': float(pallet.block_height)
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        if 'company_id' in data:
            company = Company.query.get_or_404(data['company_id'])
            if company.user_id != current_user.id:
                return jsonify({'message': 'Unauthorized'}), 403
        
        for key, value in data.items():
            setattr(pallet, key, value)
        
        volumes = calculate_component_volumes(pallet)
        pallet.upper_board_desi = volumes['upper_board_desi']
        pallet.lower_board_desi = volumes['lower_board_desi']
        pallet.closure_desi = volumes['closure_desi']
        pallet.block_desi = volumes['block_desi']
        pallet.total_volume = volumes['total_desi']
        
        db.session.commit()
        return jsonify({'message': 'Pallet updated successfully'})
    
    elif request.method == 'DELETE':
        db.session.delete(pallet)
        db.session.commit()
        return jsonify({'message': 'Pallet deleted successfully'})

@app.route('/pallets/<int:pallet_id>')
@login_required
def pallet_details(pallet_id):
    pallet = Pallet.query.join(Company).filter(
        Pallet.id == pallet_id,
        Company.user_id == current_user.id
    ).first_or_404()
    
    return render_template('pallet_details.html', pallet=pallet)

@app.route('/export/pallets/csv')
@login_required
def export_pallets_csv():
    search_term = request.args.get('search', '')
    company_id = request.args.get('company_id', type=int)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
    
    if search_term:
        query = query.filter(Pallet.name.like(f'%{search_term}%'))
    if company_id:
        query = query.filter(Pallet.company_id == company_id)
    if min_price is not None:
        query = query.filter(Pallet.price >= min_price)
    if max_price is not None:
        query = query.filter(Pallet.price <= max_price)
    
    pallets = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = ['Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
               'Üst Tahta Boyutları', 'Alt Tahta Boyutları',
               'Kapama Tahta Boyutları', 'Takoz Boyutları']
    
    writer.writerow(headers)
    
    for pallet in pallets:
        upper_board = f"{pallet.upper_board_length}x{pallet.upper_board_width}x{pallet.board_thickness} ({pallet.upper_board_quantity} adet)"
        lower_board = f"{pallet.lower_board_length}x{pallet.lower_board_width}x{pallet.board_thickness} ({pallet.lower_board_quantity} adet)"
        closure = f"{pallet.closure_length}x{pallet.closure_width}x{pallet.board_thickness} ({pallet.closure_quantity} adet)"
        block = f"{pallet.block_length}x{pallet.block_width}x{pallet.block_height} (9 adet)"
        
        writer.writerow([
            pallet.name,
            pallet.company.name,
            f"{float(pallet.price):.2f}",
            f"{float(pallet.total_volume):.2f}",
            upper_board,
            lower_board,
            closure,
            block
        ])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='paletler.csv'
    )

@app.route('/export/pallets/pdf')
@login_required
def export_pallets_pdf():
    search_term = request.args.get('search', '')
    company_id = request.args.get('company_id', type=int)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    
    query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
    
    if search_term:
        query = query.filter(Pallet.name.like(f'%{search_term}%'))
    if company_id:
        query = query.filter(Pallet.company_id == company_id)
    if min_price is not None:
        query = query.filter(Pallet.price >= min_price)
    if max_price is not None:
        query = query.filter(Pallet.price <= max_price)
    
    pallets = query.all()
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    elements = []
    
    data = [['Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
             'Üst Tahta', 'Alt Tahta', 'Kapama', 'Takoz']]
    
    for pallet in pallets:
        upper_board = f"{pallet.upper_board_length}x{pallet.upper_board_width}x{pallet.board_thickness}\n({pallet.upper_board_quantity} adet)"
        lower_board = f"{pallet.lower_board_length}x{pallet.lower_board_width}x{pallet.board_thickness}\n({pallet.lower_board_quantity} adet)"
        closure = f"{pallet.closure_length}x{pallet.closure_width}x{pallet.board_thickness}\n({pallet.closure_quantity} adet)"
        block = f"{pallet.block_length}x{pallet.block_width}x{pallet.block_height}\n(9 adet)"
        
        data.append([
            pallet.name,
            pallet.company.name,
            f"{float(pallet.price):.2f}",
            f"{float(pallet.total_volume):.2f}",
            upper_board,
            lower_board,
            closure,
            block
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    doc.build(elements)
    
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='paletler.pdf'
    )