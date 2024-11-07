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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Image, Spacer, PageBreak, Frame
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def clean_text(text):
    """Clean and encode text for PDF generation with Turkish character support"""
    try:
        return str(text).encode('utf-8').decode('utf-8')
    except Exception as e:
        logger.error(f"Error cleaning text: {str(e)}")
        return str(text)

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

@app.route('/pallets')
@login_required
def pallets():
    companies = Company.query.filter_by(user_id=current_user.id).all()
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    return render_template('pallets.html', pallets=pallets, companies=companies)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.setFont("Helvetica", 9)
            self.drawRightString(
                270*mm, 10*mm,
                f"Sayfa {self._pageNumber} / {num_pages}"
            )
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

def add_header_and_footer(canvas, doc, company=None):
    canvas.saveState()
    
    # Header
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawString(30*mm, 190*mm, 'Palet Yönetim Sistemi')
    
    if company:
        canvas.setFont('Helvetica', 10)
        canvas.drawString(30*mm, 180*mm, f'Firma: {company.name}')
        canvas.drawString(30*mm, 175*mm, f'İletişim: {company.contact_email}')
    
    # Date
    canvas.setFont('Helvetica', 10)
    current_date = datetime.now().strftime('%d.%m.%Y')
    canvas.drawString(250*mm, 190*mm, f'Tarih: {current_date}')
    
    canvas.restoreState()

@app.route('/export/pallets/pdf')
@login_required
def export_pallets_pdf():
    try:
        # Get filter parameters with proper type conversion and validation
        search = request.args.get('search', '').strip()
        company_id = request.args.get('company_id')
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')

        try:
            company_id = int(company_id) if company_id else None
            company = Company.query.get(company_id) if company_id else None
        except (ValueError, TypeError):
            company_id = None
            company = None

        try:
            min_price = float(min_price) if min_price else None
        except (ValueError, TypeError):
            min_price = None

        try:
            max_price = float(max_price) if max_price else None
        except (ValueError, TypeError):
            max_price = None
        
        logger.info(f"Starting PDF export with filters: search={search}, company_id={company_id}, price_range={min_price}-{max_price}")
        
        # Build query with filters
        query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
        
        if search:
            query = query.filter(Pallet.name.ilike(f'%{search}%'))
        if company_id is not None:
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
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=40*mm,
            bottomMargin=20*mm,
            title='Palet Listesi',
            author='Palet Yönetim Sistemi'
        )
        
        # Create styles
        styles = getSampleStyleSheet()
        
        # Header style
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=16,
            alignment=1,
            spaceAfter=20,
            textColor=colors.HexColor('#2a2e35')
        )
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=14,
            alignment=1,
            spaceAfter=10,
            textColor=colors.HexColor('#2a2e35')
        )
        
        # Normal text style
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=12,
            alignment=1
        )
        
        # Prepare document elements
        elements = []
        
        try:
            # Add header with current date
            current_date = datetime.now().strftime('%d.%m.%Y')
            header_text = f'Palet Listesi - {current_date}'
            elements.append(Paragraph(clean_text(header_text), header_style))
            elements.append(Spacer(1, 20))
            
            # Add filter information if any filters are applied
            if any([search, company_id, min_price, max_price]):
                filter_text = 'Uygulanan Filtreler:'
                if search:
                    filter_text += f' Arama: {search},'
                if company:
                    filter_text += f' Firma: {company.name},'
                if min_price:
                    filter_text += f' Min Fiyat: {min_price} TL,'
                if max_price:
                    filter_text += f' Max Fiyat: {max_price} TL,'
                
                elements.append(Paragraph(clean_text(filter_text.rstrip(',')), title_style))
                elements.append(Spacer(1, 20))
            
            # Create table data
            headers = [
                'Palet Adı',
                'Firma',
                'Fiyat (TL)',
                'Toplam Hacim (desi)',
                'Ölçüler (cm)',
                'Adet'
            ]
            
            data = [[Paragraph(clean_text(header), title_style) for header in headers]]
            
            # Add pallet data
            for pallet in pallets:
                try:
                    measurements = (
                        f"Üst Tahta: {float(pallet.upper_board_length)}x{float(pallet.upper_board_width)}x{float(pallet.board_thickness)}\n"
                        f"Alt Tahta: {float(pallet.lower_board_length)}x{float(pallet.lower_board_width)}x{float(pallet.board_thickness)}\n"
                        f"Kapama: {float(pallet.closure_length)}x{float(pallet.closure_width)}x{float(pallet.board_thickness)}\n"
                        f"Takoz: {float(pallet.block_length)}x{float(pallet.block_width)}x{float(pallet.block_height)}"
                    )
                    
                    quantities = (
                        f"Üst: {pallet.upper_board_quantity}\n"
                        f"Alt: {pallet.lower_board_quantity}\n"
                        f"Kapama: {pallet.closure_quantity}\n"
                        f"Takoz: 9"
                    )
                    
                    row = [
                        Paragraph(clean_text(pallet.name), normal_style),
                        Paragraph(clean_text(pallet.company.name), normal_style),
                        Paragraph(clean_text(f"{float(pallet.price):.2f}"), normal_style),
                        Paragraph(clean_text(f"{float(pallet.total_volume):.2f}"), normal_style),
                        Paragraph(clean_text(measurements), normal_style),
                        Paragraph(clean_text(quantities), normal_style)
                    ]
                    data.append(row)
                except Exception as row_error:
                    logger.error(f"Error processing pallet row {pallet.id}: {str(row_error)}")
                    continue
            
            # Create table with column widths
            col_widths = [100*mm, 80*mm, 60*mm, 60*mm, 180*mm, 60*mm]
            table = Table(data, colWidths=col_widths, repeatRows=1)
            
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
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('TOPPADDING', (0, 1), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                
                # Alternate row colors
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
                
                # Grid styling
                ('LINEBEFORE', (0, 0), (-1, -1), 1, colors.black),
                ('LINEAFTER', (0, 0), (-1, -1), 1, colors.black),
                ('LINEBELOW', (0, 0), (-1, -1), 1, colors.black),
                ('LINEABOVE', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            elements.append(table)
            
            # Build PDF with custom canvas for page numbers and header
            doc.build(
                elements,
                onFirstPage=lambda canvas, doc: add_header_and_footer(canvas, doc, company),
                onLaterPages=lambda canvas, doc: add_header_and_footer(canvas, doc, company),
                canvasmaker=NumberedCanvas
            )
            
            buffer.seek(0)
            logger.info("PDF generated successfully")
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'paletler_{current_date}.pdf'
            )
            
        except Exception as element_error:
            logger.error(f"Error creating PDF elements: {str(element_error)}")
            raise
        
    except Exception as e:
        logger.error(f"PDF export error: {str(e)}")
        flash('PDF oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))

@app.route('/export/pallets/csv')
@login_required
def export_pallets_csv():
    try:
        # Get filter parameters
        search = request.args.get('search', '').strip()
        company_id = request.args.get('company_id')
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')

        # Build query with filters
        query = Pallet.query.join(Company).filter(Company.user_id == current_user.id)
        
        if search:
            query = query.filter(Pallet.name.ilike(f'%{search}%'))
        if company_id:
            query = query.filter(Pallet.company_id == company_id)
        if min_price:
            query = query.filter(Pallet.price >= float(min_price))
        if max_price:
            query = query.filter(Pallet.price <= float(max_price))
        
        pallets = query.all()
        
        if not pallets:
            flash('Dışa aktarılacak palet bulunamadı.', 'warning')
            return redirect(url_for('pallets'))

        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            'Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
            'Tahta Kalınlığı (cm)',
            'Üst Tahta Uzunluk (cm)', 'Üst Tahta Genişlik (cm)', 'Üst Tahta Adet',
            'Alt Tahta Uzunluk (cm)', 'Alt Tahta Genişlik (cm)', 'Alt Tahta Adet',
            'Kapama Uzunluk (cm)', 'Kapama Genişlik (cm)', 'Kapama Adet',
            'Takoz Uzunluk (cm)', 'Takoz Genişlik (cm)', 'Takoz Yükseklik (cm)'
        ]
        writer.writerow(headers)
        
        # Write data
        for pallet in pallets:
            row = [
                pallet.name,
                pallet.company.name,
                f"{float(pallet.price):.2f}",
                f"{float(pallet.total_volume):.2f}",
                float(pallet.board_thickness),
                float(pallet.upper_board_length),
                float(pallet.upper_board_width),
                pallet.upper_board_quantity,
                float(pallet.lower_board_length),
                float(pallet.lower_board_width),
                pallet.lower_board_quantity,
                float(pallet.closure_length),
                float(pallet.closure_width),
                pallet.closure_quantity,
                float(pallet.block_length),
                float(pallet.block_width),
                float(pallet.block_height)
            ]
            writer.writerow(row)
        
        # Prepare response
        output.seek(0)
        current_date = datetime.now().strftime('%d_%m_%Y')
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'paletler_{current_date}.csv'
        )
        
    except Exception as e:
        logger.error(f"CSV export error: {str(e)}")
        flash('CSV oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
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
        'id': company.id,
        'name': company.name,
        'contact_email': company.contact_email
    } for company in companies])

@app.route('/api/companies/<int:company_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_company(company_id):
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
            
            # Create new pallet
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
        'id': pallet.id,
        'name': pallet.name,
        'company_id': pallet.company_id,
        'price': float(pallet.price)
    } for pallet in pallets])

@app.route('/api/pallets/<int:pallet_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_pallet(pallet_id):
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
            
            # Update pallet attributes
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
        
        if not all([username, email, password, confirm_password]):
            flash('Tüm alanları doldurunuz', 'danger')
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
        
        try:
            db.session.add(user)
            db.session.commit()
            flash('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            logger.error(f"Error during user registration: {str(e)}")
            db.session.rollback()
            flash('Kayıt sırasında bir hata oluştu', 'danger')
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))
