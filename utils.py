def calculate_component_volumes(pallet):
    """Calculate individual and total volumes of pallet components in desi (1 desi = 1000 cm³)"""
    try:
        # Convert Decimal to float for calculations
        def to_float(value):
            return float(str(value)) if value is not None else 0.0
        
        # Get dimensions as floats
        board_thickness = to_float(pallet.board_thickness)
        
        # Calculate upper boards volume
        upper_board_volume = (
            to_float(pallet.upper_board_length) * 
            to_float(pallet.upper_board_width) * 
            board_thickness * 
            to_float(pallet.upper_board_quantity)
        )
        upper_board_desi = round(upper_board_volume / 1000, 2)
        
        # Calculate lower boards volume
        lower_board_volume = (
            to_float(pallet.lower_board_length) * 
            to_float(pallet.lower_board_width) * 
            board_thickness * 
            to_float(pallet.lower_board_quantity)
        )
        lower_board_desi = round(lower_board_volume / 1000, 2)
        
        # Calculate closure boards volume
        closure_volume = (
            to_float(pallet.closure_length) * 
            to_float(pallet.closure_width) * 
            board_thickness * 
            to_float(pallet.closure_quantity)
        )
        closure_desi = round(closure_volume / 1000, 2)
        
        # Calculate blocks volume (fixed 9 blocks)
        block_volume = (
            to_float(pallet.block_length) * 
            to_float(pallet.block_width) * 
            to_float(pallet.block_height) * 9  # Fixed 9 blocks
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
    except Exception as e:
        logger.error(f"Error calculating component volumes: {str(e)}")
        # Return zero values if calculation fails
        return {
            'upper_board_desi': 0,
            'lower_board_desi': 0,
            'closure_desi': 0,
            'block_desi': 0,
            'total_desi': 0
        }
