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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import logging

logger = logging.getLogger(__name__)

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

@app.route('/pallets')
@login_required
def pallets():
    companies = Company.query.filter_by(user_id=current_user.id).all()
    query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
    pallets = query.all()
    return render_template('pallets.html', pallets=pallets, companies=companies)

@app.route('/export/pallets/csv')
@login_required
def export_pallets_csv():
    try:
        # Get filter parameters
        search_term = request.args.get('search', '')
        company_id = request.args.get('company_id', type=int)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Build query with filters
        query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
        
        if search_term:
            query = query.filter(Pallet.name.ilike(f'%{search_term}%'))
        if company_id:
            query = query.filter(Pallet.company_id == company_id)
        if min_price is not None:
            query = query.filter(Pallet.price >= min_price)
        if max_price is not None:
            query = query.filter(Pallet.price <= max_price)
            
        pallets = query.all()
        
        if not pallets:
            flash('Dışa aktarılacak palet bulunamadı.', 'warning')
            return redirect(url_for('pallets'))
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
                        'Üst Tahta', 'Alt Tahta', 'Kapama', 'Takoz'])
        
        # Write data
        for pallet in pallets:
            writer.writerow([
                pallet.name,
                pallet.company.name,
                f"{float(pallet.price):.2f}",
                f"{float(pallet.total_volume):.2f}",
                f"{float(pallet.upper_board_length)}x{float(pallet.upper_board_width)}x{float(pallet.board_thickness)} ({pallet.upper_board_quantity} adet)",
                f"{float(pallet.lower_board_length)}x{float(pallet.lower_board_width)}x{float(pallet.board_thickness)} ({pallet.lower_board_quantity} adet)",
                f"{float(pallet.closure_length)}x{float(pallet.closure_width)}x{float(pallet.board_thickness)} ({pallet.closure_quantity} adet)",
                f"{float(pallet.block_length)}x{float(pallet.block_width)}x{float(pallet.block_height)} (9 adet)"
            ])
        
        # Prepare response
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='paletler.csv'
        )
        
    except Exception as e:
        logger.error(f"CSV export error: {str(e)}")
        flash('CSV oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))

@app.route('/export/pallets/pdf')
@login_required
def export_pallets_pdf():
    try:
        # Get filter parameters
        search_term = request.args.get('search', '')
        company_id = request.args.get('company_id', type=int)
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        
        # Build query with filters
        query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
        
        if search_term:
            query = query.filter(Pallet.name.ilike(f'%{search_term}%'))
        if company_id:
            query = query.filter(Pallet.company_id == company_id)
        if min_price is not None:
            query = query.filter(Pallet.price >= min_price)
        if max_price is not None:
            query = query.filter(Pallet.price <= max_price)
        
        pallets = query.all()
        
        if not pallets:
            logger.warning("No pallets found for PDF export")
            flash('Dışa aktarılacak palet bulunamadı.', 'warning')
            return redirect(url_for('pallets'))

        # Create PDF buffer
        buffer = io.BytesIO()
        
        # Set up the document with landscape orientation and margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30,
            title='Palet Listesi'
        )
        
        # Create styles
        styles = getSampleStyleSheet()
        
        # Custom style for normal text
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            alignment=1,  # Center alignment
            spaceAfter=6
        )
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            alignment=1,
            spaceAfter=20
        )
        
        # Prepare document elements
        elements = []
        
        # Add title
        elements.append(Paragraph('Palet Listesi', title_style))
        
        # Prepare table data
        headers = [
            'Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
            'Üst Tahta', 'Alt Tahta', 'Kapama', 'Takoz'
        ]
        data = [[Paragraph(header, normal_style) for header in headers]]
        
        # Add pallet data
        for pallet in pallets:
            try:
                row = [
                    Paragraph(str(pallet.name), normal_style),
                    Paragraph(str(pallet.company.name), normal_style),
                    Paragraph(f"{float(pallet.price):.2f}", normal_style),
                    Paragraph(f"{float(pallet.total_volume):.2f}", normal_style),
                    Paragraph(
                        f"{float(pallet.upper_board_length)}x{float(pallet.upper_board_width)}x{float(pallet.board_thickness)} "
                        f"({pallet.upper_board_quantity} adet)", normal_style
                    ),
                    Paragraph(
                        f"{float(pallet.lower_board_length)}x{float(pallet.lower_board_width)}x{float(pallet.board_thickness)} "
                        f"({pallet.lower_board_quantity} adet)", normal_style
                    ),
                    Paragraph(
                        f"{float(pallet.closure_length)}x{float(pallet.closure_width)}x{float(pallet.board_thickness)} "
                        f"({pallet.closure_quantity} adet)", normal_style
                    ),
                    Paragraph(
                        f"{float(pallet.block_length)}x{float(pallet.block_width)}x{float(pallet.block_height)} "
                        f"(9 adet)", normal_style
                    )
                ]
                data.append(row)
            except Exception as row_error:
                logger.error(f"Error processing pallet row: {str(row_error)}")
                continue
        
        # Create table with adjusted column widths
        colWidths = [90, 80, 60, 70, 100, 100, 100, 100]
        table = Table(data, colWidths=colWidths, repeatRows=1)
        
        # Apply table styling
        table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2a2e35')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Content styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWHEIGHT', (0, 0), (-1, -1), 40),
        ]))
        
        elements.append(table)

        try:
            # Build PDF
            doc.build(elements)
            buffer.seek(0)
            
            response = send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='paletler.pdf'
            )
            
            return response
            
        except Exception as build_error:
            logger.error(f"Error building PDF: {str(build_error)}")
            flash('PDF oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
            return redirect(url_for('pallets'))
        
    except Exception as e:
        logger.error(f"PDF export error: {str(e)}")
        flash('PDF oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))

@app.route('/api/companies', methods=['GET', 'POST'])
@login_required
def api_companies():
    if request.method == 'POST':
        try:
            data = request.get_json()
            company = Company(
                name=data['name'],
                contact_email=data['contact_email'],
                user_id=current_user.id
            )
            db.session.add(company)
            db.session.commit()
            return jsonify({'message': 'Firma başarıyla eklendi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400
    
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'contact_email': c.contact_email
    } for c in companies])

@app.route('/api/companies/<int:company_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_company(company_id):
    company = Company.query.filter_by(id=company_id, user_id=current_user.id).first_or_404()
    
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
    
    elif request.method == 'DELETE':
        try:
            db.session.delete(company)
            db.session.commit()
            return jsonify({'message': 'Firma başarıyla silindi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400

@app.route('/api/pallets', methods=['GET', 'POST'])
@login_required
def api_pallets():
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Verify company ownership
            company = Company.query.filter_by(id=data['company_id'], user_id=current_user.id).first()
            if not company:
                return jsonify({'message': 'Firma bulunamadı'}), 404
            
            pallet = Pallet(**data)
            
            # Calculate volumes
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes['upper_board_desi']
            pallet.lower_board_desi = volumes['lower_board_desi']
            pallet.closure_desi = volumes['closure_desi']
            pallet.block_desi = volumes['block_desi']
            pallet.total_volume = volumes['total_desi']
            
            db.session.add(pallet)
            db.session.commit()
            
            return jsonify({'message': 'Palet başarıyla eklendi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400
    
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'company_id': p.company_id,
        'price': float(p.price),
        'total_volume': float(p.total_volume)
    } for p in pallets])

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_pallet(pallet_id):
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
        try:
            data = request.get_json()
            
            # Verify company ownership
            company = Company.query.filter_by(id=data['company_id'], user_id=current_user.id).first()
            if not company:
                return jsonify({'message': 'Firma bulunamadı'}), 404
            
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
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400
    
    elif request.method == 'DELETE':
        try:
            db.session.delete(pallet)
            db.session.commit()
            return jsonify({'message': 'Palet başarıyla silindi'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 400
