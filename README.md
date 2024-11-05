# Palet Yönetim Sistemi

Modern web teknolojileri kullanılarak geliştirilmiş, şirketlerin palet spesifikasyonlarını yönetmelerini ve görselleştirmelerini sağlayan kapsamlı bir sistem.

## Proje Açıklaması

Bu sistem, şirketlerin palet envanterlerini etkili bir şekilde yönetmelerini sağlar. Kullanıcılar, farklı palet tiplerini tanımlayabilir, ölçülerini kaydedebilir ve otomatik hacim hesaplamaları yapabilir. Modern ve kullanıcı dostu arayüzü sayesinde kolay kullanım sağlar.

## Özellikler

- Şirket ve palet yönetimi
  - Çoklu şirket desteği
  - Detaylı palet spesifikasyonları
  - Özelleştirilebilir palet tipleri
- Otomatik hesaplamalar
  - Desi hesaplama
  - Hacim hesaplama
  - Toplam malzeme kullanımı
- Veri dışa aktarma
  - PDF rapor oluşturma
  - CSV formatında veri aktarma
- Gelişmiş görselleştirme
  - Palet boyut görselleştirme
  - İstatistik grafikleri
- Responsive tasarım
  - Mobil uyumlu arayüz
  - Dark tema desteği
- Güvenlik özellikleri
  - Kullanıcı kimlik doğrulama
  - Yetkilendirme sistemi

## Sistem Gereksinimleri

- Python 3.8 veya üzeri
- MySQL 5.7 veya üzeri
- Modern web tarayıcısı (Chrome, Firefox, Safari)
- Minimum 1GB RAM
- 500MB disk alanı

## Kurulum

1. Python paketlerini yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

2. MySQL veritabanı kurulumu:
   - MySQL Server'ı yükleyin
   - Yeni bir veritabanı oluşturun
   - Kullanıcı oluşturun ve yetkilendirin

3. Çevre değişkenlerini ayarlayın:
   ```bash
   export FLASK_SECRET_KEY="gizli_anahtar"
   export DATABASE_URL="mysql+pymysql://kullanici:sifre@localhost:3306/veritabani"
   ```
   
   Veya aşağıdaki değişkenleri ayrı ayrı ayarlayın:
   ```bash
   export PGUSER="kullanici"
   export PGPASSWORD="sifre"
   export PGHOST="localhost"
   export PGPORT="3306"
   export PGDATABASE="veritabani"
   ```

4. Veritabanı tablolarını oluşturun:
   ```bash
   python seed_data.py
   ```

5. Uygulamayı başlatın:
   ```bash
   python main.py
   ```

## Yapılandırma

### Veritabanı Yapılandırması

MySQL bağlantı ayarları `app.py` dosyasında yapılandırılmıştır. Aşağıdaki parametreler özelleştirilebilir:

- `pool_size`: Bağlantı havuzu boyutu (varsayılan: 10)
- `pool_timeout`: Bağlantı zaman aşımı (varsayılan: 900 saniye)
- `pool_recycle`: Bağlantı yenileme süresi (varsayılan: 300 saniye)

### Uygulama Ayarları

- `FLASK_SECRET_KEY`: Oturum güvenliği için gizli anahtar
- `DEBUG`: Geliştirme modu (True/False)
- `UPLOAD_FOLDER`: Dosya yükleme dizini

## Sorun Giderme

### Veritabanı Bağlantı Sorunları

1. MySQL servisinin çalıştığından emin olun:
   ```bash
   systemctl status mysql
   ```

2. Veritabanı bağlantı bilgilerini kontrol edin:
   - Kullanıcı adı ve şifrenin doğru olduğundan emin olun
   - Port numarasının doğru olduğunu kontrol edin
   - Veritabanı isminin doğru olduğunu kontrol edin

3. Yaygın hatalar ve çözümleri:
   - "Access denied": Kullanıcı yetkilerini kontrol edin
   - "Connection refused": MySQL servisinin çalıştığından emin olun
   - "Unknown database": Veritabanının oluşturulduğunu kontrol edin

### Uygulama Sorunları

1. Log dosyalarını kontrol edin:
   - Hata mesajlarını inceleyin
   - Flask uygulama loglarını kontrol edin

2. Paket bağımlılıklarını kontrol edin:
   ```bash
   pip install -r requirements.txt --no-cache-dir
   ```

3. Sistem kaynaklarını kontrol edin:
   - RAM kullanımı
   - CPU kullanımı
   - Disk alanı

## Lisans

MIT

## İletişim

Sorunlar ve öneriler için GitHub Issues kullanabilirsiniz.
