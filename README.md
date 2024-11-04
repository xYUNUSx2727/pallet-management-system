# Palet Yönetim Sistemi

Flask ve PostgreSQL kullanılarak geliştirilmiş palet spesifikasyonlarını yönetme ve görselleştirme sistemi.

## Özellikler

- Firma yönetimi
- Palet spesifikasyonları ve ölçüleri
- Otomatik desi hesaplama
- PDF ve CSV export
- Responsive tasarım
- Palet görselleştirme

## Kurulum

1. Python 3.8+ yükleyin
2. PostgreSQL veritabanı kurun
3. Gereksinimleri yükleyin:
   ```bash
   pip install -r requirements.txt
   ```
4. Çevre değişkenlerini ayarlayın:
   - DATABASE_URL
   - FLASK_SECRET_KEY

5. Veritabanını oluşturun:
   ```bash
   python seed_data.py
   ```

6. Uygulamayı başlatın:
   ```bash
   python main.py
   ```

## Kullanım

1. /register ile yeni hesap oluşturun
2. Firma ekleyin
3. Paletleri tanımlayın
4. Raporları görüntüleyin ve export edin

## Lisans

MIT
