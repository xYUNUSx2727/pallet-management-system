document.addEventListener('DOMContentLoaded', function() {
    // Initialize filter elements
    filterElements = {
        searchName: document.getElementById('searchName'),
        filterCompany: document.getElementById('filterCompany'),
        minPrice: document.getElementById('minPrice'),
        maxPrice: document.getElementById('maxPrice'),
        sortOrder: document.getElementById('sortOrder'),
        noResults: document.getElementById('noResults')
    };

    // Add event listeners for filters
    Object.values(filterElements).forEach(element => {
        if (element && element !== filterElements.noResults) {
            element.addEventListener('input', filterAndSortPallets);
        }
    });

    // Initialize save button event listener
    const saveButton = document.getElementById('savePallet');
    if (saveButton) {
        saveButton.addEventListener('click', handleSavePallet);
    }

    // Initialize edit buttons
    document.querySelectorAll('.edit-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            try {
                const palletId = e.currentTarget.dataset.id;
                const response = await fetch(`/api/pallets/${palletId}`);
                if (!response.ok) {
                    throw new Error('Palet bilgileri alınamadı');
                }
                const pallet = await response.json();
                populatePalletForm(pallet);
                new bootstrap.Modal(document.getElementById('palletModal')).show();
            } catch (error) {
                console.error('Düzenleme hatası:', error);
                alert('Palet bilgileri yüklenirken bir hata oluştu');
            }
        });
    });

    // Initialize delete buttons
    document.querySelectorAll('.delete-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
                return;
            }
            try {
                const palletId = e.currentTarget.dataset.id;
                const response = await fetch(`/api/pallets/${palletId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Palet silinemedi');
                }
                window.location.reload();
            } catch (error) {
                console.error('Silme hatası:', error);
                alert('Palet silinirken bir hata oluştu');
            }
        });
    });
});

// Validate pallet data before submission
function validatePalletData(data) {
    const requiredFields = {
        name: 'Palet adı',
        company_id: 'Firma',
        price: 'Fiyat',
        board_thickness: 'Tahta kalınlığı',
        upper_board_length: 'Üst tahta uzunluğu',
        upper_board_width: 'Üst tahta genişliği',
        upper_board_quantity: 'Üst tahta adedi',
        lower_board_length: 'Alt tahta uzunluğu',
        lower_board_width: 'Alt tahta genişliği',
        lower_board_quantity: 'Alt tahta adedi',
        closure_length: 'Kapama uzunluğu',
        closure_width: 'Kapama genişliği',
        closure_quantity: 'Kapama adedi',
        block_length: 'Takoz uzunluğu',
        block_width: 'Takoz genişliği',
        block_height: 'Takoz yüksekliği'
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        if (!data[field] && data[field] !== 0) {
            throw new Error(`${label} alanı boş bırakılamaz`);
        }
        if (typeof data[field] === 'number' && data[field] <= 0) {
            throw new Error(`${label} için geçerli bir değer giriniz`);
        }
    }
    return true;
}

// Handle saving pallet data
async function handleSavePallet() {
    try {
        const form = document.getElementById('palletForm');
        if (!form) {
            throw new Error('Form bulunamadı');
        }

        const palletData = {
            name: document.getElementById('palletName').value.trim(),
            company_id: parseInt(document.getElementById('companySelect').value),
            price: parseFloat(document.getElementById('price').value) || 0,
            board_thickness: parseFloat(document.getElementById('boardThickness').value) || 0,
            upper_board_length: parseFloat(document.getElementById('upperBoardLength').value) || 0,
            upper_board_width: parseFloat(document.getElementById('upperBoardWidth').value) || 0,
            upper_board_quantity: parseInt(document.getElementById('upperBoardQuantity').value) || 0,
            lower_board_length: parseFloat(document.getElementById('lowerBoardLength').value) || 0,
            lower_board_width: parseFloat(document.getElementById('lowerBoardWidth').value) || 0,
            lower_board_quantity: parseInt(document.getElementById('lowerBoardQuantity').value) || 0,
            closure_length: parseFloat(document.getElementById('closureLength').value) || 0,
            closure_width: parseFloat(document.getElementById('closureWidth').value) || 0,
            closure_quantity: parseInt(document.getElementById('closureQuantity').value) || 0,
            block_length: parseFloat(document.getElementById('blockLength').value) || 0,
            block_width: parseFloat(document.getElementById('blockWidth').value) || 0,
            block_height: parseFloat(document.getElementById('blockHeight').value) || 0
        };

        // Validate the data
        validatePalletData(palletData);

        const palletId = document.getElementById('palletId').value;
        const url = palletId ? `/api/pallets/${palletId}` : '/api/pallets';
        const method = palletId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(palletData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Palet kaydedilirken bir hata oluştu');
        }

        window.location.reload();
    } catch (error) {
        console.error('Palet kaydetme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Populate form with pallet data for editing
function populatePalletForm(pallet) {
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
}
