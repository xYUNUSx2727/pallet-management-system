from app import app, db
from models import Company, Pallet, User
from utils import calculate_component_volumes

def seed_data():
    with app.app_context():
        # Create default admin user first
        admin = User(
            username='admin',
            email='admin@example.com',
            is_admin=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()

        # Create companies
        companies = [
            Company(name='Ahşap Palet A.Ş.', contact_email='info@ahsappalet.com', user_id=admin.id),
            Company(name='Eco Palet Ltd.', contact_email='info@ecopalet.com', user_id=admin.id),
            Company(name='Mega Palet ve Ambalaj', contact_email='info@megapalet.com', user_id=admin.id),
            Company(name='Star Palet Sistemleri', contact_email='info@starpalet.com', user_id=admin.id),
            Company(name='Global Palet Çözümleri', contact_email='info@globalpalet.com', user_id=admin.id),
            Company(name='Endüstriyel Palet Ltd.', contact_email='info@endustriyelpalet.com', user_id=admin.id)
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
            # Other pallets...
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
