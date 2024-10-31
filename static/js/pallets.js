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

            palletModal.show();
        });
    });

    // Delete Pallet
    document.querySelectorAll('.delete-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (confirm('Are you sure you want to delete this pallet?')) {
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
});
