from flask import render_template, redirect, url_for, flash, request, jsonify, send_file, make_response
from flask_login import login_user, logout_user, login_required, current_user
from app import app, db
from models import User, Company, Pallet
from utils import calculate_component_volumes
from werkzeug.security import generate_password_hash
import csv
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def clean_text(text):
    """Clean and encode text for PDF generation with Turkish character support"""
    try:
        if text is None:
            return ""
        return str(text).encode('utf-8').decode('utf-8')
    except Exception as e:
        logger.error(f"Error cleaning text: {str(e)}")
        return str(text) if text is not None else ""

def format_float(value, precision=2):
    """Format float values with proper error handling"""
    try:
        return f"{float(value):.{precision}f}" if value is not None else "0.00"
    except (ValueError, TypeError) as e:
        logger.error(f"Error formatting float value {value}: {str(e)}")
        return "0.00"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        """Add page numbers to each page"""
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

def add_letterhead(canvas, doc, company=None):
    """Add letterhead with company information to each page"""
    try:
        canvas.saveState()
        
        # Add company logo or system logo
        canvas.setFont('Helvetica-Bold', 16)
        canvas.drawString(30*mm, 190*mm, 'Palet Yönetim Sistemi')
        
        if company:
            canvas.setFont('Helvetica', 12)
            canvas.drawString(30*mm, 180*mm, f'Firma: {clean_text(company.name)}')
            canvas.drawString(30*mm, 175*mm, f'İletişim: {clean_text(company.contact_email)}')
        
        # Add date and time
        canvas.setFont('Helvetica', 10)
        current_date = datetime.now().strftime('%d.%m.%Y %H:%M')
        canvas.drawString(250*mm, 190*mm, f'Tarih: {current_date}')
        
        canvas.restoreState()
    except Exception as e:
        logger.error(f"Error adding letterhead: {str(e)}")

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

@app.route('/export/pallets/pdf')
@login_required
def export_pallets_pdf():
    try:
        # Get and validate filter parameters
        search = request.args.get('search', '').strip()
        company_id = request.args.get('company_id')
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')

        # Parameter validation with detailed error handling
        try:
            company_id = int(company_id) if company_id else None
            company = Company.query.get(company_id) if company_id else None
            if company_id and not company:
                flash('Belirtilen firma bulunamadı.', 'warning')
                return redirect(url_for('pallets'))
        except (ValueError, TypeError):
            logger.warning(f"Invalid company_id parameter: {company_id}")
            company_id = None
            company = None

        try:
            min_price = float(min_price) if min_price else None
            if min_price is not None and min_price < 0:
                flash('Minimum fiyat 0\'dan küçük olamaz.', 'warning')
                return redirect(url_for('pallets'))
        except (ValueError, TypeError):
            logger.warning(f"Invalid min_price parameter: {min_price}")
            min_price = None

        try:
            max_price = float(max_price) if max_price else None
            if max_price is not None and max_price < 0:
                flash('Maksimum fiyat 0\'dan küçük olamaz.', 'warning')
                return redirect(url_for('pallets'))
        except (ValueError, TypeError):
            logger.warning(f"Invalid max_price parameter: {max_price}")
            max_price = None
        
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
        
        # Add header with current date
        current_date = datetime.now().strftime('%d.%m.%Y %H:%M')
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
        total_price = 0
        total_volume = 0
        invalid_records = 0
        
        for pallet in pallets:
            try:
                measurements = (
                    f"Üst Tahta: {format_float(pallet.upper_board_length)}x{format_float(pallet.upper_board_width)}x{format_float(pallet.board_thickness)}\n"
                    f"Alt Tahta: {format_float(pallet.lower_board_length)}x{format_float(pallet.lower_board_width)}x{format_float(pallet.board_thickness)}\n"
                    f"Kapama: {format_float(pallet.closure_length)}x{format_float(pallet.closure_width)}x{format_float(pallet.board_thickness)}\n"
                    f"Takoz: {format_float(pallet.block_length)}x{format_float(pallet.block_width)}x{format_float(pallet.block_height)}"
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
                    Paragraph(format_float(pallet.price), normal_style),
                    Paragraph(format_float(pallet.total_volume), normal_style),
                    Paragraph(clean_text(measurements), normal_style),
                    Paragraph(clean_text(quantities), normal_style)
                ]
                data.append(row)
                
                total_price += float(pallet.price) if pallet.price is not None else 0
                total_volume += float(pallet.total_volume) if pallet.total_volume is not None else 0
                
            except Exception as row_error:
                logger.error(f"Error processing pallet row {pallet.id}: {str(row_error)}")
                invalid_records += 1
                continue
        
        if invalid_records > 0:
            logger.warning(f"{invalid_records} records were skipped due to data errors")
        
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
        elements.append(Spacer(1, 20))
        
        # Add summary section
        summary_text = (
            f"Özet:\n"
            f"Toplam Palet Sayısı: {len(pallets)}\n"
            f"Başarıyla İşlenen Kayıt: {len(pallets) - invalid_records}\n"
            f"Hatalı Kayıt: {invalid_records}\n"
            f"Toplam Fiyat: {format_float(total_price)} TL\n"
            f"Toplam Hacim: {format_float(total_volume)} desi"
        )
        elements.append(Paragraph(clean_text(summary_text), title_style))
        
        # Build PDF with custom canvas for page numbers and header
        doc.build(
            elements,
            onFirstPage=lambda canvas, doc: add_letterhead(canvas, doc, company),
            onLaterPages=lambda canvas, doc: add_letterhead(canvas, doc, company),
            canvasmaker=NumberedCanvas
        )
        
        buffer.seek(0)
        logger.info("PDF generated successfully")
        
        # Create response with proper headers
        response = make_response(send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'paletler_{current_date.replace(":", "_")}.pdf'
        ))
        
        # Add headers for better browser handling
        response.headers['Content-Disposition'] = f'attachment; filename="paletler_{current_date.replace(":", "_")}.pdf"'
        response.headers['Cache-Control'] = 'no-cache'
        return response
        
    except Exception as e:
        logger.error(f"PDF export error: {str(e)}")
        flash('PDF oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))

@app.route('/export/pallets/csv')
@login_required
def export_pallets_csv():
    try:
        # Create string buffer for CSV data
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            'Palet Adı', 'Firma', 'Fiyat (TL)', 'Toplam Hacim (desi)',
            'Üst Tahta Ölçüleri', 'Alt Tahta Ölçüleri', 'Kapama Ölçüleri', 'Takoz Ölçüleri'
        ])
        
        # Get pallets for current user
        pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
        
        # Write pallet data
        for pallet in pallets:
            writer.writerow([
                pallet.name,
                pallet.company.name,
                format_float(pallet.price),
                format_float(pallet.total_volume),
                f"{format_float(pallet.upper_board_length)}x{format_float(pallet.upper_board_width)}x{format_float(pallet.board_thickness)} ({pallet.upper_board_quantity} adet)",
                f"{format_float(pallet.lower_board_length)}x{format_float(pallet.lower_board_width)}x{format_float(pallet.board_thickness)} ({pallet.lower_board_quantity} adet)",
                f"{format_float(pallet.closure_length)}x{format_float(pallet.closure_width)}x{format_float(pallet.board_thickness)} ({pallet.closure_quantity} adet)",
                f"{format_float(pallet.block_length)}x{format_float(pallet.block_width)}x{format_float(pallet.block_height)} (9 adet)"
            ])
        
        # Prepare the response
        output.seek(0)
        current_date = datetime.now().strftime('%Y%m%d_%H%M')
        return Response(
            output,
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=paletler_{current_date}.csv',
                'Content-Type': 'text/csv; charset=utf-8'
            }
        )
        
    except Exception as e:
        logger.error(f"CSV export error: {str(e)}")
        flash('CSV oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'danger')
        return redirect(url_for('pallets'))
