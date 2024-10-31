def calculate_pallet_volume(pallet):
    """Calculate total volume of pallet in cubic meters"""
    # Calculate top board volume
    top_board_volume = (
        pallet.top_length * 
        pallet.top_width * 
        pallet.top_height
    )
    
    # Calculate bottom board volume
    bottom_board_volume = (
        pallet.bottom_length * 
        pallet.bottom_width * 
        pallet.bottom_height
    )
    
    # Calculate chassis volume
    chassis_volume = (
        pallet.chassis_length * 
        pallet.chassis_width * 
        pallet.chassis_height
    )
    
    # Calculate blocks volume (9 blocks)
    block_volume = (
        pallet.block_length * 
        pallet.block_width * 
        pallet.block_height * 9
    )
    
    # Total volume in cubic millimeters
    total_volume = top_board_volume + bottom_board_volume + chassis_volume + block_volume
    
    # Convert to cubic meters and round to 6 decimal places
    return round(total_volume / 1000000000, 6)  # Convert from mm³ to m³
