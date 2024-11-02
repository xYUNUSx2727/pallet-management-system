from app import app, db
from models import Company, Pallet
from utils import calculate_component_volumes

def seed_data():
    with app.app_context():
        # Create companies
        companies = [
            Company(name='Ahşap Palet A.Ş.', contact_email='info@ahsappalet.com'),
            Company(name='Eco Palet Ltd.', contact_email='info@ecopalet.com'),
            Company(name='Mega Palet ve Ambalaj', contact_email='info@megapalet.com'),
            Company(name='Star Palet Sistemleri', contact_email='info@starpalet.com'),
            Company(name='Global Palet Çözümleri', contact_email='info@globalpalet.com'),
            Company(name='Endüstriyel Palet Ltd.', contact_email='info@endustriyelpalet.com')
        ]
        
        for company in companies:
            existing = Company.query.filter_by(name=company.name).first()
            if not existing:
                db.session.add(company)
        db.session.commit()

        # Create pallets for each company
        pallets = [
            # Ahşap Palet A.Ş. pallets
            {
                'name': 'Standart Euro Palet',
                'company_id': 1,
                'price': 250.00,
                'board_thickness': 2.2,
                'upper_board_length': 120,
                'upper_board_width': 10,
                'upper_board_quantity': 5,
                'lower_board_length': 120,
                'lower_board_width': 10,
                'lower_board_quantity': 3,
                'closure_length': 80,
                'closure_width': 10,
                'closure_quantity': 3,
                'block_length': 10,
                'block_width': 10,
                'block_height': 10
            },
            {
                'name': 'Endüstriyel Palet',
                'company_id': 1,
                'price': 320.00,
                'board_thickness': 2.5,
                'upper_board_length': 100,
                'upper_board_width': 12,
                'upper_board_quantity': 6,
                'lower_board_length': 100,
                'lower_board_width': 12,
                'lower_board_quantity': 4,
                'closure_length': 85,
                'closure_width': 12,
                'closure_quantity': 4,
                'block_length': 12,
                'block_width': 12,
                'block_height': 12
            },
            # Eco Palet Ltd. pallets
            {
                'name': 'Hafif Palet',
                'company_id': 2,
                'price': 180.00,
                'board_thickness': 1.8,
                'upper_board_length': 90,
                'upper_board_width': 8,
                'upper_board_quantity': 4,
                'lower_board_length': 90,
                'lower_board_width': 8,
                'lower_board_quantity': 3,
                'closure_length': 70,
                'closure_width': 8,
                'closure_quantity': 3,
                'block_length': 8,
                'block_width': 8,
                'block_height': 8
            },
            {
                'name': 'Geri Dönüşüm Palet',
                'company_id': 2,
                'price': 150.00,
                'board_thickness': 2.0,
                'upper_board_length': 110,
                'upper_board_width': 9,
                'upper_board_quantity': 5,
                'lower_board_length': 110,
                'lower_board_width': 9,
                'lower_board_quantity': 3,
                'closure_length': 75,
                'closure_width': 9,
                'closure_quantity': 3,
                'block_length': 9,
                'block_width': 9,
                'block_height': 9
            },
            # Mega Palet pallets
            {
                'name': 'Ağır Yük Paleti',
                'company_id': 3,
                'price': 450.00,
                'board_thickness': 3.0,
                'upper_board_length': 130,
                'upper_board_width': 15,
                'upper_board_quantity': 7,
                'lower_board_length': 130,
                'lower_board_width': 15,
                'lower_board_quantity': 5,
                'closure_length': 95,
                'closure_width': 15,
                'closure_quantity': 4,
                'block_length': 15,
                'block_width': 15,
                'block_height': 15
            },
            # Star Palet pallets
            {
                'name': 'İhracat Paleti',
                'company_id': 4,
                'price': 280.00,
                'board_thickness': 2.4,
                'upper_board_length': 105,
                'upper_board_width': 11,
                'upper_board_quantity': 5,
                'lower_board_length': 105,
                'lower_board_width': 11,
                'lower_board_quantity': 4,
                'closure_length': 80,
                'closure_width': 11,
                'closure_quantity': 3,
                'block_length': 11,
                'block_width': 11,
                'block_height': 11
            },
            # Global Palet Çözümleri pallets
            {
                'name': 'Kimyasal Palet',
                'company_id': 5,
                'price': 550.00,
                'board_thickness': 3.2,
                'upper_board_length': 140,
                'upper_board_width': 16,
                'upper_board_quantity': 8,
                'lower_board_length': 140,
                'lower_board_width': 16,
                'lower_board_quantity': 6,
                'closure_length': 100,
                'closure_width': 16,
                'closure_quantity': 5,
                'block_length': 16,
                'block_width': 16,
                'block_height': 16
            },
            {
                'name': 'Mini Palet',
                'company_id': 5,
                'price': 120.00,
                'board_thickness': 1.5,
                'upper_board_length': 60,
                'upper_board_width': 8,
                'upper_board_quantity': 4,
                'lower_board_length': 60,
                'lower_board_width': 8,
                'lower_board_quantity': 3,
                'closure_length': 45,
                'closure_width': 8,
                'closure_quantity': 3,
                'block_length': 8,
                'block_width': 8,
                'block_height': 8
            },
            # Endüstriyel Palet Ltd. pallets
            {
                'name': 'Plastik Kompozit Palet',
                'company_id': 6,
                'price': 680.00,
                'board_thickness': 2.8,
                'upper_board_length': 125,
                'upper_board_width': 14,
                'upper_board_quantity': 6,
                'lower_board_length': 125,
                'lower_board_width': 14,
                'lower_board_quantity': 4,
                'closure_length': 90,
                'closure_width': 14,
                'closure_quantity': 4,
                'block_length': 14,
                'block_width': 14,
                'block_height': 14
            },
            {
                'name': 'ISPM-15 Palet',
                'company_id': 6,
                'price': 420.00,
                'board_thickness': 2.6,
                'upper_board_length': 115,
                'upper_board_width': 12,
                'upper_board_quantity': 6,
                'lower_board_length': 115,
                'lower_board_width': 12,
                'lower_board_quantity': 4,
                'closure_length': 85,
                'closure_width': 12,
                'closure_quantity': 4,
                'block_length': 12,
                'block_width': 12,
                'block_height': 12
            }
        ]

        # Calculate volumes and add pallets
        for pallet_data in pallets:
            pallet = Pallet(**pallet_data)
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes['upper_board_desi']
            pallet.lower_board_desi = volumes['lower_board_desi']
            pallet.closure_desi = volumes['closure_desi']
            pallet.block_desi = volumes['block_desi']
            pallet.total_volume = volumes['total_desi']
            db.session.add(pallet)
        
        db.session.commit()

if __name__ == '__main__':
    seed_data()
