def calculate_pallet_volume(pallet):
    """Calculate total volume of pallet in cubic meters"""
    top_volume = pallet.top_length * pallet.top_width * pallet.top_height
    bottom_volume = pallet.bottom_length * pallet.bottom_width * pallet.bottom_height
    chassis_volume = pallet.chassis_length * pallet.chassis_width * pallet.chassis_height
    block_volume = (pallet.block_length * pallet.block_width * pallet.block_height) * 9  # Assuming 9 blocks
    
    total_volume = (top_volume + bottom_volume + chassis_volume + block_volume) / 1000000  # Convert from cm³ to m³
    return round(total_volume, 6)
