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
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
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
            query = query.filter(Pallet.name.like(f'%{search_term}%'))
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
            query = query.filter(Pallet.name.like(f'%{search_term}%'))
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
        
        # Set up the document with custom page size and margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        # Create styles with proper encoding
        styles = getSampleStyleSheet()
        
        # Custom style for normal text with proper encoding
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=1,  # Center alignment
            encoding='utf-8'
        )
        
        # Title style with proper encoding
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            alignment=1,
            spaceAfter=20,
            encoding='utf-8'
        )
        
        # Prepare document elements
        elements = []
        
        # Add title
        elements.append(Paragraph('Palet Listesi', title_style))
        
        # Prepare table data with proper text encoding
        data = [[
            Paragraph('Palet Adı', normal_style),
            Paragraph('Firma', normal_style),
            Paragraph('Fiyat (TL)', normal_style),
            Paragraph('Toplam Hacim (desi)', normal_style),
            Paragraph('Üst Tahta', normal_style),
            Paragraph('Alt Tahta', normal_style),
            Paragraph('Kapama', normal_style),
            Paragraph('Takoz', normal_style)
        ]]
        
        def clean_text(text):
            """Clean and encode text for PDF"""
            try:
                return str(text).strip()
            except Exception as e:
                logger.error(f"Error cleaning text: {str(e)}")
                return str(text)
        
        try:
            # Add pallet data with proper text cleaning
            for pallet in pallets:
                row = [
                    Paragraph(clean_text(pallet.name), normal_style),
                    Paragraph(clean_text(pallet.company.name), normal_style),
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
        except Exception as data_error:
            logger.error(f"Error processing pallet data: {str(data_error)}")
            raise
        
        # Create table with styling
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            # Header styling
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2a2e35')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Content styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ROWHEIGHT', (0, 0), (-1, -1), 40)
        ]))
        
        elements.append(table)
        
        try:
            # Build PDF with error handling
            doc.build(elements)
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='paletler.pdf'
            )
        except Exception as build_error:
            logger.error(f"Error building PDF: {str(build_error)}")
            raise
        
    except Exception as e:
        logger.error(f"PDF export error: {str(e)}")
        flash('PDF oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))