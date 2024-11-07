// Filter and sort utility functions
function getSortValue(item, sortOrder) {
    if (sortOrder.startsWith('name')) {
        const nameText = item.querySelector('td:first-child, .accordion-button')?.textContent.toLowerCase() || '';
        return nameText;
    }
    if (sortOrder.includes('price')) {
        return parseFloat(item.dataset.price) || 0;
    }
    if (sortOrder.includes('volume')) {
        return parseFloat(item.dataset.volume) || 0;
    }
    return 0;
}

// Main filter and sort function - defined at the top level
function filterAndSortPallets() {
    try {
        const searchTerm = document.getElementById('searchName')?.value.toLowerCase() || '';
        const companyId = document.getElementById('filterCompany')?.value || '';
        const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
        const sortOrder = document.getElementById('sortOrder')?.value;

        const palletsList = document.getElementById('palletsList');
        const palletsAccordion = document.getElementById('palletsAccordion');
        const noResults = document.getElementById('noResults');

        let items = [];
        if (palletsList) {
            items = Array.from(palletsList.getElementsByTagName('tr'));
        } else if (palletsAccordion) {
            items = Array.from(palletsAccordion.getElementsByClassName('accordion-item'));
        }

        let visibleCount = 0;

        items.forEach(item => {
            const itemName = item.querySelector('td:first-child, .accordion-button')?.textContent.toLowerCase() || '';
            const itemCompanyId = item.dataset.companyId;
            const itemPrice = parseFloat(item.dataset.price) || 0;

            const matchesSearch = itemName.includes(searchTerm);
            const matchesCompany = !companyId || itemCompanyId === companyId;
            const matchesPrice = itemPrice >= minPrice && (!maxPrice || itemPrice <= maxPrice);

            const isVisible = matchesSearch && matchesCompany && matchesPrice;
            if (isVisible) visibleCount++;

            item.style.display = isVisible ? '' : 'none';
        });

        if (visibleCount > 0 && sortOrder) {
            const sortedItems = Array.from(items)
                .filter(item => item.style.display !== 'none')
                .sort((a, b) => {
                    const aValue = getSortValue(a, sortOrder);
                    const bValue = getSortValue(b, sortOrder);
                    if (typeof aValue === 'string') {
                        return sortOrder.includes('desc') ? 
                            bValue.localeCompare(aValue, 'tr') : 
                            aValue.localeCompare(bValue, 'tr');
                    }
                    return sortOrder.includes('desc') ? bValue - aValue : aValue - bValue;
                });

            const container = palletsList || palletsAccordion;
            if (container) {
                sortedItems.forEach(item => container.appendChild(item));
            }
        }

        if (noResults) {
            noResults.classList.toggle('d-none', visibleCount > 0);
        }
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for filters
    const filterElements = [
        'searchName',
        'filterCompany',
        'minPrice',
        'maxPrice',
        'sortOrder'
    ];

    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', filterAndSortPallets);
            element.addEventListener('change', filterAndSortPallets);
        }
    });

    // Initialize filtering on load
    filterAndSortPallets();

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

// Desi calculation function
function calculateDesi() {
    try {
        const getValue = (id) => parseFloat(document.getElementById(id)?.value) || 0;

        const thickness = getValue('boardThickness');
        
        // Upper boards
        const upperLength = getValue('upperBoardLength');
        const upperWidth = getValue('upperBoardWidth');
        const upperQuantity = getValue('upperBoardQuantity');
        const upperDesi = (upperLength * upperWidth * thickness * upperQuantity) / 1000;
        
        // Lower boards
        const lowerLength = getValue('lowerBoardLength');
        const lowerWidth = getValue('lowerBoardWidth');
        const lowerQuantity = getValue('lowerBoardQuantity');
        const lowerDesi = (lowerLength * lowerWidth * thickness * lowerQuantity) / 1000;
        
        // Closure boards
        const closureLength = getValue('closureLength');
        const closureWidth = getValue('closureWidth');
        const closureQuantity = getValue('closureQuantity');
        const closureDesi = (closureLength * closureWidth * thickness * closureQuantity) / 1000;
        
        // Blocks (fixed 9 blocks)
        const blockLength = getValue('blockLength');
        const blockWidth = getValue('blockWidth');
        const blockHeight = getValue('blockHeight');
        const blockDesi = (blockLength * blockWidth * blockHeight * 9) / 1000;
        
        // Update display values
        const elements = {
            'upperBoardDesi': upperDesi,
            'lowerBoardDesi': lowerDesi,
            'closureDesi': closureDesi,
            'blockDesi': blockDesi,
            'totalDesi': upperDesi + lowerDesi + closureDesi + blockDesi
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toFixed(2);
            }
        });
    } catch (error) {
        console.error('Desi hesaplama hatası:', error);
    }
}

// Form validation function
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

// Save pallet function
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
        console.error('Form doğrulama hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Populate form function
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
    
    calculateDesi();
}
