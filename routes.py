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
            return redirect(next_page if next_page else url_for('dashboard'))
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
    return redirect(url_for('dashboard'))

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
    pallets = Pallet.query.join(Company).filter(Company.user_id == current_user.id).all()
    companies = Company.query.filter_by(user_id=current_user.id).all()
    return render_template('pallets.html', pallets=pallets, companies=companies)
