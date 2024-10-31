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
            top_length: parseFloat(document.getElementById('topLength').value),
            top_width: parseFloat(document.getElementById('topWidth').value),
            top_height: parseFloat(document.getElementById('topHeight').value),
            bottom_length: parseFloat(document.getElementById('bottomLength').value),
            bottom_width: parseFloat(document.getElementById('bottomWidth').value),
            bottom_height: parseFloat(document.getElementById('bottomHeight').value),
            chassis_length: parseFloat(document.getElementById('chassisLength').value),
            chassis_width: parseFloat(document.getElementById('chassisWidth').value),
            chassis_height: parseFloat(document.getElementById('chassisHeight').value),
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
            
            // Set all dimensions
            document.getElementById('topLength').value = pallet.top_length;
            document.getElementById('topWidth').value = pallet.top_width;
            document.getElementById('topHeight').value = pallet.top_height;
            document.getElementById('bottomLength').value = pallet.bottom_length;
            document.getElementById('bottomWidth').value = pallet.bottom_width;
            document.getElementById('bottomHeight').value = pallet.bottom_height;
            document.getElementById('chassisLength').value = pallet.chassis_length;
            document.getElementById('chassisWidth').value = pallet.chassis_width;
            document.getElementById('chassisHeight').value = pallet.chassis_height;
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
