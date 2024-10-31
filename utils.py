def calculate_component_volumes(pallet):
    """Calculate individual and total volumes of pallet components in desi (1 desi = 1000 cm³)"""
    
    # Calculate upper boards volume
    upper_board_volume = (
        pallet.upper_board_length * 
        pallet.upper_board_width * 
        pallet.board_thickness * 
        pallet.upper_board_quantity
    )
    upper_board_desi = round(upper_board_volume / 1000, 2)
    
    # Calculate lower boards volume
    lower_board_volume = (
        pallet.lower_board_length * 
        pallet.lower_board_width * 
        pallet.board_thickness * 
        pallet.lower_board_quantity
    )
    lower_board_desi = round(lower_board_volume / 1000, 2)
    
    # Calculate closure boards volume
    closure_volume = (
        pallet.closure_length * 
        pallet.closure_width * 
        pallet.board_thickness * 
        pallet.closure_quantity
    )
    closure_desi = round(closure_volume / 1000, 2)
    
    # Calculate blocks volume (fixed 9 blocks)
    block_volume = (
        pallet.block_length * 
        pallet.block_width * 
        pallet.block_height * 9  # Fixed 9 blocks
    )
    block_desi = round(block_volume / 1000, 2)
    
    # Total desi
    total_desi = round(upper_board_desi + lower_board_desi + closure_desi + block_desi, 2)
    
    return {
        'upper_board_desi': upper_board_desi,
        'lower_board_desi': lower_board_desi,
        'closure_desi': closure_desi,
        'block_desi': block_desi,
        'total_desi': total_desi
    }
