// Initialize filterElements globally
let filterElements;

// Define the filtering function
const filterAndSortPallets = function() {
    try {
        // Validate filter elements
        if (!filterElements) {
            throw new Error('Filtre elemanları başlatılamadı');
        }

        const searchTerm = filterElements.searchName?.value?.toLowerCase() || '';
        const companyId = filterElements.filterCompany?.value || '';
        const minPrice = parseFloat(filterElements.minPrice?.value) || 0;
        const maxPrice = parseFloat(filterElements.maxPrice?.value) || Infinity;
        const sortOrder = filterElements.sortOrder?.value || 'name_asc';

        const items = document.querySelectorAll('tr[data-company-id], .accordion-item');
        if (!items.length) {
            throw new Error('Palet listesi bulunamadı');
        }

        let visibleCount = 0;

        items.forEach(item => {
            const companyMatch = !companyId || item.dataset.companyId === companyId;
            const price = parseFloat(item.dataset.price) || 0;
            const priceMatch = price >= minPrice && (maxPrice === Infinity || price <= maxPrice);
            const nameElement = item.querySelector('td:first-child, .accordion-button');
            const nameMatch = nameElement ? nameElement.textContent.toLowerCase().includes(searchTerm) : false;

            if (companyMatch && priceMatch && nameMatch) {
                item.style.display = '';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        if (filterElements.noResults) {
            filterElements.noResults.classList.toggle('d-none', visibleCount > 0);
        }

        // Update export links with current filter parameters
        updateExportLinks();
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
};

// Update export links with current filter parameters
function updateExportLinks() {
    try {
        const params = new URLSearchParams();
        if (filterElements.filterCompany?.value) {
            params.set('company_id', filterElements.filterCompany.value);
        }
        if (filterElements.minPrice?.value) {
            params.set('min_price', filterElements.minPrice.value);
        }
        if (filterElements.maxPrice?.value) {
            params.set('max_price', filterElements.maxPrice.value);
        }
        if (filterElements.searchName?.value) {
            params.set('search', filterElements.searchName.value);
        }

        const pdfLink = document.querySelector('a[href*="export/pallets/pdf"]');
        const csvLink = document.querySelector('a[href*="export/pallets/csv"]');

        if (pdfLink) {
            const baseUrl = pdfLink.href.split('?')[0];
            pdfLink.href = `${baseUrl}?${params.toString()}`;
        }
        if (csvLink) {
            const baseUrl = csvLink.href.split('?')[0];
            csvLink.href = `${baseUrl}?${params.toString()}`;
        }
    } catch (error) {
        console.error('Export link güncelleme hatası:', error);
    }
}

function calculateDesi() {
    try {
        // Get individual measurements first
        const boardThickness = parseFloat(document.getElementById('boardThickness')?.value) || 0;
        const upperBoardLength = parseFloat(document.getElementById('upperBoardLength')?.value) || 0;
        const upperBoardWidth = parseFloat(document.getElementById('upperBoardWidth')?.value) || 0;
        const upperBoardQuantity = parseFloat(document.getElementById('upperBoardQuantity')?.value) || 0;
        const lowerBoardLength = parseFloat(document.getElementById('lowerBoardLength')?.value) || 0;
        const lowerBoardWidth = parseFloat(document.getElementById('lowerBoardWidth')?.value) || 0;
        const lowerBoardQuantity = parseFloat(document.getElementById('lowerBoardQuantity')?.value) || 0;
        const closureLength = parseFloat(document.getElementById('closureLength')?.value) || 0;
        const closureWidth = parseFloat(document.getElementById('closureWidth')?.value) || 0;
        const closureQuantity = parseFloat(document.getElementById('closureQuantity')?.value) || 0;
        const blockLength = parseFloat(document.getElementById('blockLength')?.value) || 0;
        const blockWidth = parseFloat(document.getElementById('blockWidth')?.value) || 0;
        const blockHeight = parseFloat(document.getElementById('blockHeight')?.value) || 0;

        // Calculate individual sections
        let upperDesi = 0;
        if (boardThickness && upperBoardLength && upperBoardWidth && upperBoardQuantity) {
            upperDesi = (upperBoardLength * upperBoardWidth * boardThickness * upperBoardQuantity) / 1000;
            document.getElementById('upperBoardDesi').textContent = upperDesi.toFixed(2);
        }

        let lowerDesi = 0;
        if (boardThickness && lowerBoardLength && lowerBoardWidth && lowerBoardQuantity) {
            lowerDesi = (lowerBoardLength * lowerBoardWidth * boardThickness * lowerBoardQuantity) / 1000;
            document.getElementById('lowerBoardDesi').textContent = lowerDesi.toFixed(2);
        }

        let closureDesi = 0;
        if (boardThickness && closureLength && closureWidth && closureQuantity) {
            closureDesi = (closureLength * closureWidth * boardThickness * closureQuantity) / 1000;
            document.getElementById('closureDesi').textContent = closureDesi.toFixed(2);
        }

        let blockDesi = 0;
        if (blockLength && blockWidth && blockHeight) {
            blockDesi = (blockLength * blockWidth * blockHeight * 9) / 1000;
            document.getElementById('blockDesi').textContent = blockDesi.toFixed(2);
        }

        // Calculate total
        const totalDesi = upperDesi + lowerDesi + closureDesi + blockDesi;
        document.getElementById('totalDesi').textContent = totalDesi.toFixed(2);
    } catch (error) {
        console.error('Desi hesaplama hatası:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize Bootstrap components
        const palletModalElement = document.getElementById('palletModal');
        if (!palletModalElement) {
            throw new Error('Palet modal elementi bulunamadı');
        }
        const palletModal = new bootstrap.Modal(palletModalElement);

        // Initialize filter elements with validation
        filterElements = {
            searchName: document.getElementById('searchName'),
            filterCompany: document.getElementById('filterCompany'),
            minPrice: document.getElementById('minPrice'),
            maxPrice: document.getElementById('maxPrice'),
            sortOrder: document.getElementById('sortOrder'),
            noResults: document.getElementById('noResults'),
            palletsList: document.getElementById('palletsList'),
            palletsAccordion: document.getElementById('palletsAccordion')
        };

        // Add input event listeners for real-time desi calculations
        const measurementInputs = [
            'boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
            'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
            'closureLength', 'closureWidth', 'closureQuantity',
            'blockLength', 'blockWidth', 'blockHeight'
        ];

        measurementInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                let timeout;
                element.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(calculateDesi, 500);
                });
            }
        });

        // Add filter event listeners
        Object.entries(filterElements).forEach(([key, element]) => {
            if (element && !['noResults', 'palletsList', 'palletsAccordion'].includes(key)) {
                element.addEventListener('change', filterAndSortPallets);
                if (element.tagName === 'INPUT') {
                    let timeout;
                    element.addEventListener('input', () => {
                        clearTimeout(timeout);
                        timeout = setTimeout(filterAndSortPallets, 300);
                    });
                }
            }
        });

        // Save pallet handler with improved validation
        const handleSavePallet = async () => {
            try {
                // Get company ID from select
                const companyId = document.getElementById('companySelect').value;
                if (!companyId) {
                    throw new Error('Lütfen bir firma seçin');
                }

                // Get form data
                const form = document.getElementById('palletForm');
                if (!form) {
                    throw new Error('Palet formu bulunamadı');
                }

                const palletData = {
                    name: document.getElementById('palletName').value,
                    company_id: parseInt(companyId),
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

                // Validate all fields
                Object.entries(palletData).forEach(([key, value]) => {
                    if (value === null || value === undefined || isNaN(value)) {
                        throw new Error(`${key} için geçerli bir değer giriniz`);
                    }
                });

                const palletId = document.getElementById('palletId')?.value;
                const response = await fetch(palletId ? `/api/pallets/${palletId}` : '/api/pallets', {
                    method: palletId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(palletData)
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Palet kaydedilirken bir hata oluştu');
                }

                window.location.reload();
            } catch (error) {
                console.error('Palet kaydetme hatası:', error);
                alert('Palet kaydetme hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
            }
        };

        // Add event listener to save button
        const saveButton = document.getElementById('savePallet');
        if (saveButton) {
            saveButton.addEventListener('click', handleSavePallet);
        }

        // View pallet handler
        document.querySelectorAll('.view-pallet').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                try {
                    const palletId = e.currentTarget.dataset.id;
                    if (!palletId) {
                        throw new Error('Palet ID bulunamadı');
                    }
                    window.location.href = `/pallets/${palletId}`;
                } catch (error) {
                    console.error('Görüntüleme hatası:', error);
                    alert('Görüntüleme hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
                }
            });
        });

        // Edit pallet handler
        document.querySelectorAll('.edit-pallet').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                try {
                    const palletId = e.currentTarget.dataset.id;
                    if (!palletId) {
                        throw new Error('Palet ID bulunamadı');
                    }

                    const response = await fetch(`/api/pallets/${palletId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Palet bilgileri alınamadı');
                    }

                    const pallet = await response.json();
                    Object.entries(pallet).forEach(([key, value]) => {
                        const element = document.getElementById(key) || 
                                  document.getElementById(`pallet${key.charAt(0).toUpperCase() + key.slice(1)}`);
                        if (element) {
                            element.value = value;
                        }
                    });

                    calculateDesi();
                    palletModal.show();
                } catch (error) {
                    console.error('Düzenleme hatası:', error);
                    alert('Düzenleme hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
                }
            });
        });

        // Delete pallet handler
        document.querySelectorAll('.delete-pallet').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                try {
                    if (!confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
                        return;
                    }

                    const palletId = e.currentTarget.dataset.id;
                    if (!palletId) {
                        throw new Error('Palet ID bulunamadı');
                    }

                    const response = await fetch(`/api/pallets/${palletId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Palet silinirken bir hata oluştu');
                    }

                    window.location.reload();
                } catch (error) {
                    console.error('Silme hatası:', error);
                    alert('Silme hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
                }
            });
        });

        // Initial filtering and export link setup
        filterAndSortPallets();
        updateExportLinks();
    } catch (error) {
        console.error('Başlatma hatası:', error);
        alert('Başlatma hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
    }
});
