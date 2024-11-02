from app import app, db
from models import Company, Pallet

def seed_data():
    with app.app_context():
        # Create companies
        companies = [
            Company(name='Ahşap Palet A.Ş.', contact_email='info@ahsappalet.com'),
            Company(name='Eco Palet Ltd.', contact_email='info@ecopalet.com'),
            Company(name='Mega Palet ve Ambalaj', contact_email='info@megapalet.com'),
            Company(name='Star Palet Sistemleri', contact_email='info@starpalet.com')
        ]
        
        for company in companies:
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
            {
                'name': 'Konteyner Paleti',
                'company_id': 3,
                'price': 380.00,
                'board_thickness': 2.8,
                'upper_board_length': 115,
                'upper_board_width': 14,
                'upper_board_quantity': 6,
                'lower_board_length': 115,
                'lower_board_width': 14,
                'lower_board_quantity': 4,
                'closure_length': 90,
                'closure_width': 14,
                'closure_quantity': 4,
                'block_length': 14,
                'block_width': 14,
                'block_height': 14
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
            {
                'name': 'Tek Yönlü Palet',
                'company_id': 4,
                'price': 200.00,
                'board_thickness': 2.0,
                'upper_board_length': 95,
                'upper_board_width': 10,
                'upper_board_quantity': 4,
                'lower_board_length': 95,
                'lower_board_width': 10,
                'lower_board_quantity': 3,
                'closure_length': 75,
                'closure_width': 10,
                'closure_quantity': 3,
                'block_length': 10,
                'block_width': 10,
                'block_height': 10
            }
        ]

        for pallet_data in pallets:
            pallet = Pallet(**pallet_data)
            db.session.add(pallet)
        
        db.session.commit()

if __name__ == '__main__':
    seed_data()
