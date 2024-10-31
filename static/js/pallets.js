document.addEventListener('DOMContentLoaded', function() {
    const palletModal = new bootstrap.Modal(document.getElementById('palletModal'));
    const palletForm = document.getElementById('palletForm');
    const saveButton = document.getElementById('savePallet');

    // Add/Edit Pallet
    saveButton.addEventListener('click', async () => {
        const palletId = document.getElementById('palletId').value;
        const palletData = {
            name: document.getElementById('palletName').value,
            company_id: document.getElementById('companySelect').value,
            price: parseFloat(document.getElementById('price').value),
            board_thickness: parseFloat(document.getElementById('boardThickness').value),
            upper_board_length: parseFloat(document.getElementById('upperBoardLength').value),
            upper_board_width: parseFloat(document.getElementById('upperBoardWidth').value),
            upper_board_quantity: parseInt(document.getElementById('upperBoardQuantity').value),
            lower_board_length: parseFloat(document.getElementById('lowerBoardLength').value),
            lower_board_width: parseFloat(document.getElementById('lowerBoardWidth').value),
            lower_board_quantity: parseInt(document.getElementById('lowerBoardQuantity').value),
            closure_length: parseFloat(document.getElementById('closureLength').value),
            closure_width: parseFloat(document.getElementById('closureWidth').value),
            closure_quantity: parseInt(document.getElementById('closureQuantity').value),
            block_length: parseFloat(document.getElementById('blockLength').value),
            block_width: parseFloat(document.getElementById('blockWidth').value),
            block_height: parseFloat(document.getElementById('blockHeight').value)
        };

        const url = palletId ? `/api/pallets/${palletId}` : '/api/pallets';
        const method = palletId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(palletData)
            });

            if (response.ok) {
                location.reload();
            } else {
                alert('Error saving pallet');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Edit Pallet
    document.querySelectorAll('.edit-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            const palletId = e.target.dataset.id;
            const response = await fetch(`/api/pallets/${palletId}`);
            const pallet = await response.json();

            document.getElementById('palletId').value = pallet.id;
            document.getElementById('palletName').value = pallet.name;
            document.getElementById('companySelect').value = pallet.company_id;
            document.getElementById('price').value = pallet.price;
            
            document.getElementById('boardThickness').value = pallet.board_thickness;
            document.getElementById('upperBoardLength').value = pallet.upper_board_length;
            document.getElementById('upperBoardWidth').value = pallet.upper_board_width;
            document.getElementById('upperBoardQuantity').value = pallet.upper_board_quantity;
            document.getElementById('lowerBoardLength').value = pallet.lower_board_length;
            document.getElementById('lowerBoardWidth').value = pallet.lower_board_width;
            document.getElementById('lowerBoardQuantity').value = pallet.lower_board_quantity;
            document.getElementById('closureLength').value = pallet.closure_length;
            document.getElementById('closureWidth').value = pallet.closure_width;
            document.getElementById('closureQuantity').value = pallet.closure_quantity;
            document.getElementById('blockLength').value = pallet.block_length;
            document.getElementById('blockWidth').value = pallet.block_width;
            document.getElementById('blockHeight').value = pallet.block_height;

            // Update desi calculations
            updateDesiCalculations();

            palletModal.show();
        });
    });

    // Delete Pallet
    document.querySelectorAll('.delete-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
                const palletId = e.target.dataset.id;
                
                try {
                    const response = await fetch(`/api/pallets/${palletId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        location.reload();
                    } else {
                        alert('Error deleting pallet');
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        });
    });

    // View Pallet Details
    document.querySelectorAll('.view-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            const palletId = e.target.dataset.id;
            window.location.href = `/pallets/${palletId}`;
        });
    });

    // Calculate desi values
    function calculateDesi(length, width, height, quantity = 1) {
        return ((length * width * height * quantity) / 1000).toFixed(2);
    }

    function updateDesiCalculations() {
        const thickness = parseFloat(document.getElementById('boardThickness').value) || 0;

        // Upper boards
        const upperLength = parseFloat(document.getElementById('upperBoardLength').value) || 0;
        const upperWidth = parseFloat(document.getElementById('upperBoardWidth').value) || 0;
        const upperQuantity = parseInt(document.getElementById('upperBoardQuantity').value) || 0;
        document.getElementById('upperBoardDesi').textContent = 
            calculateDesi(upperLength, upperWidth, thickness, upperQuantity);

        // Lower boards
        const lowerLength = parseFloat(document.getElementById('lowerBoardLength').value) || 0;
        const lowerWidth = parseFloat(document.getElementById('lowerBoardWidth').value) || 0;
        const lowerQuantity = parseInt(document.getElementById('lowerBoardQuantity').value) || 0;
        document.getElementById('lowerBoardDesi').textContent = 
            calculateDesi(lowerLength, lowerWidth, thickness, lowerQuantity);

        // Closure boards
        const closureLength = parseFloat(document.getElementById('closureLength').value) || 0;
        const closureWidth = parseFloat(document.getElementById('closureWidth').value) || 0;
        const closureQuantity = parseInt(document.getElementById('closureQuantity').value) || 0;
        document.getElementById('closureDesi').textContent = 
            calculateDesi(closureLength, closureWidth, thickness, closureQuantity);

        // Blocks (fixed 9 quantity)
        const blockLength = parseFloat(document.getElementById('blockLength').value) || 0;
        const blockWidth = parseFloat(document.getElementById('blockWidth').value) || 0;
        const blockHeight = parseFloat(document.getElementById('blockHeight').value) || 0;
        document.getElementById('blockDesi').textContent = 
            calculateDesi(blockLength, blockWidth, blockHeight, 9);
    }

    // Add event listeners for real-time desi calculations
    const dimensionInputs = [
        'boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
        'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
        'closureLength', 'closureWidth', 'closureQuantity',
        'blockLength', 'blockWidth', 'blockHeight'
    ];

    dimensionInputs.forEach(inputId => {
        document.getElementById(inputId).addEventListener('input', updateDesiCalculations);
    });
});
