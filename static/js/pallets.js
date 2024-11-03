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

function validateMeasurements(measurements) {
    const errors = [];
    for (const [key, value] of Object.entries(measurements)) {
        if (isNaN(value) || value <= 0) {
            errors.push(`${key} geçersiz veya negatif bir değer içeriyor`);
        }
    }
    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }
}

function calculateDesi() {
    try {
        // Get all measurement inputs
        const measurements = {};
        const inputs = [
            'boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
            'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
            'closureLength', 'closureWidth', 'closureQuantity',
            'blockLength', 'blockWidth', 'blockHeight'
        ];

        // Only calculate if all values are present and valid
        for (const id of inputs) {
            const element = document.getElementById(id);
            if (!element) continue;
            
            const value = parseFloat(element.value);
            if (!isNaN(value) && value > 0) {
                measurements[id] = value;
            }
        }

        // Only proceed if we have all required measurements
        if (Object.keys(measurements).length === inputs.length) {
            // Calculate volumes
            const upperDesi = (measurements.upperBoardLength * measurements.upperBoardWidth * 
                            measurements.boardThickness * measurements.upperBoardQuantity) / 1000;
            const lowerDesi = (measurements.lowerBoardLength * measurements.lowerBoardWidth * 
                            measurements.boardThickness * measurements.lowerBoardQuantity) / 1000;
            const closureDesi = (measurements.closureLength * measurements.closureWidth * 
                              measurements.boardThickness * measurements.closureQuantity) / 1000;
            const blockDesi = (measurements.blockLength * measurements.blockWidth * 
                            measurements.blockHeight * 9) / 1000;
            const totalDesi = upperDesi + lowerDesi + closureDesi + blockDesi;

            // Update UI only if calculation succeeded
            document.getElementById('upperBoardDesi').textContent = upperDesi.toFixed(2);
            document.getElementById('lowerBoardDesi').textContent = lowerDesi.toFixed(2);
            document.getElementById('closureDesi').textContent = closureDesi.toFixed(2);
            document.getElementById('blockDesi').textContent = blockDesi.toFixed(2);
            document.getElementById('totalDesi').textContent = totalDesi.toFixed(2);
        }
    } catch (error) {
        console.error('Desi hesaplama hatası:', error);
        // Don't show error messages for incomplete calculations
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

        // Validate required filter elements
        const requiredElements = ['searchName', 'filterCompany', 'sortOrder'];
        requiredElements.forEach(elementId => {
            if (!filterElements[elementId]) {
                throw new Error(`${elementId} elementi bulunamadı`);
            }
        });

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
                    timeout = setTimeout(calculateDesi, 500); // Add 500ms delay
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

        // Save pallet handler with improved validation and error handling
        const handleSavePallet = async () => {
            try {
                const form = document.getElementById('palletForm');
                if (!form) {
                    throw new Error('Palet formu bulunamadı');
                }

                const formData = new FormData(form);
                const palletData = {};

                for (const [key, value] of formData.entries()) {
                    if (!value.trim()) {
                        throw new Error(`${key} alanı boş bırakılamaz`);
                    }
                    if (key !== 'palletName') {
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue <= 0) {
                            throw new Error(`${key} için geçerli bir pozitif sayı giriniz`);
                        }
                        palletData[key] = numValue;
                    } else {
                        palletData[key] = value.trim();
                    }
                }

                const palletId = document.getElementById('palletId')?.value;
                const response = await fetch(palletId ? `/api/pallets/${palletId}` : '/api/pallets', {
                    method: palletId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(palletData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Palet kaydedilirken bir hata oluştu');
                }

                window.location.reload();
            } catch (error) {
                console.error('Palet kaydetme hatası:', error);
                alert('Palet kaydetme hatası: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
            }
        };

        // Add event listeners to action buttons
        const saveButton = document.getElementById('savePallet');
        if (saveButton) {
            saveButton.addEventListener('click', handleSavePallet);
        }

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
