from app import app, db
from models import Company, Pallet
from utils import calculate_component_volumes

def seed_data():
    with app.app_context():
        # First drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        # Create companies first
        companies = [
            Company(name='Ahşap Palet A.Ş.', contact_email='info@ahsappalet.com'),
            Company(name='Eco Palet Ltd.', contact_email='info@ecopalet.com'),
            Company(name='Mega Palet ve Ambalaj', contact_email='info@megapalet.com'),
            Company(name='Star Palet Sistemleri', contact_email='info@starpalet.com')
        ]
        
        # Add and commit companies first
        for company in companies:
            db.session.add(company)
        db.session.commit()

        # Now create and add pallets
        pallets_data = [
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
            # Add other pallet data here...
        ]

        # Create pallets with volume calculations
        for pallet_data in pallets_data:
            pallet = Pallet(**pallet_data)
            # Calculate volumes before saving
            volumes = calculate_component_volumes(pallet)
            pallet.upper_board_desi = volumes['upper_board_desi']
            pallet.lower_board_desi = volumes['lower_board_desi']
            pallet.closure_desi = volumes['closure_desi']
            pallet.block_desi = volumes['block_desi']
            pallet.total_volume = volumes['total_desi']
            db.session.add(pallet)
            
        # Commit all pallets
        db.session.commit()

if __name__ == '__main__':
    seed_data()
