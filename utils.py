def calculate_pallet_volume(pallet):
    """Calculate total volume of pallet in desi (1 desi = 1000 cm³)"""
    # Calculate upper boards volume
    upper_board_volume = (
        pallet.upper_board_length * 
        pallet.upper_board_width * 
        pallet.board_thickness * 
        pallet.upper_board_quantity
    )
    
    # Calculate lower boards volume
    lower_board_volume = (
        pallet.lower_board_length * 
        pallet.lower_board_width * 
        pallet.board_thickness * 
        pallet.lower_board_quantity
    )
    
    # Calculate closure boards volume
    closure_volume = (
        pallet.closure_length * 
        pallet.closure_width * 
        pallet.board_thickness * 
        pallet.closure_quantity
    )
    
    # Calculate blocks volume
    block_volume = (
        pallet.block_length * 
        pallet.block_width * 
        pallet.block_height
    )
    
    # Total volume in cubic centimeters
    total_volume_cm3 = upper_board_volume + lower_board_volume + closure_volume + block_volume
    
    # Convert to desi (1 desi = 1000 cm³) and round to 2 decimal places
    return round(total_volume_cm3 / 1000, 2)
