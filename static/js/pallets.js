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
    } catch (error) {
        alert(`Filtreleme işlemi sırasında bir hata oluştu: ${error.message}`);
    }
};

function validateMeasurements(measurements) {
    for (const [key, value] of Object.entries(measurements)) {
        if (isNaN(value) || value < 0) {
            throw new Error(`Geçersiz ${key} değeri`);
        }
    }
}

function calculateDesi() {
    try {
        const measurements = {
            'Tahta Kalınlığı': parseFloat(document.getElementById('boardThickness')?.value) || 0,
            'Üst Tahta Uzunluğu': parseFloat(document.getElementById('upperBoardLength')?.value) || 0,
            'Üst Tahta Genişliği': parseFloat(document.getElementById('upperBoardWidth')?.value) || 0,
            'Üst Tahta Adedi': parseInt(document.getElementById('upperBoardQuantity')?.value) || 0,
            'Alt Tahta Uzunluğu': parseFloat(document.getElementById('lowerBoardLength')?.value) || 0,
            'Alt Tahta Genişliği': parseFloat(document.getElementById('lowerBoardWidth')?.value) || 0,
            'Alt Tahta Adedi': parseInt(document.getElementById('lowerBoardQuantity')?.value) || 0,
            'Kapatma Uzunluğu': parseFloat(document.getElementById('closureLength')?.value) || 0,
            'Kapatma Genişliği': parseFloat(document.getElementById('closureWidth')?.value) || 0,
            'Kapatma Adedi': parseInt(document.getElementById('closureQuantity')?.value) || 0,
            'Takoz Uzunluğu': parseFloat(document.getElementById('blockLength')?.value) || 0,
            'Takoz Genişliği': parseFloat(document.getElementById('blockWidth')?.value) || 0,
            'Takoz Yüksekliği': parseFloat(document.getElementById('blockHeight')?.value) || 0
        };

        validateMeasurements(measurements);

        // Calculate volumes
        const upperDesi = (measurements['Üst Tahta Uzunluğu'] * measurements['Üst Tahta Genişliği'] * 
                          measurements['Tahta Kalınlığı'] * measurements['Üst Tahta Adedi']) / 1000;
        const lowerDesi = (measurements['Alt Tahta Uzunluğu'] * measurements['Alt Tahta Genişliği'] * 
                          measurements['Tahta Kalınlığı'] * measurements['Alt Tahta Adedi']) / 1000;
        const closureDesi = (measurements['Kapatma Uzunluğu'] * measurements['Kapatma Genişliği'] * 
                            measurements['Tahta Kalınlığı'] * measurements['Kapatma Adedi']) / 1000;
        const blockDesi = (measurements['Takoz Uzunluğu'] * measurements['Takoz Genişliği'] * 
                          measurements['Takoz Yüksekliği'] * 9) / 1000;
        const totalDesi = upperDesi + lowerDesi + closureDesi + blockDesi;

        // Update UI with null checks
        const desiElements = {
            'upperBoardDesi': upperDesi,
            'lowerBoardDesi': lowerDesi,
            'closureDesi': closureDesi,
            'blockDesi': blockDesi,
            'totalDesi': totalDesi
        };

        Object.entries(desiElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toFixed(2);
            }
        });
    } catch (error) {
        alert(`Desi hesaplama hatası: ${error.message}`);
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
        const inputs = ['boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
                       'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
                       'closureLength', 'closureWidth', 'closureQuantity',
                       'blockLength', 'blockWidth', 'blockHeight'];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', calculateDesi);
            }
        });

        // Add filter event listeners
        Object.entries(filterElements).forEach(([key, element]) => {
            if (element && !['noResults', 'palletsList', 'palletsAccordion'].includes(key)) {
                element.addEventListener('change', filterAndSortPallets);
                if (element.tagName === 'INPUT') {
                    element.addEventListener('keyup', filterAndSortPallets);
                }
            }
        });

        // Initialize accordions with error handling
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', (e) => {
                try {
                    if (!e.target.dataset.bsTarget) {
                        throw new Error('Geçersiz accordion hedefi');
                    }
                    const target = document.querySelector(e.target.dataset.bsTarget);
                    if (!target) {
                        throw new Error('Accordion içeriği bulunamadı');
                    }
                    new bootstrap.Collapse(target);
                } catch (error) {
                    alert(`Accordion hatası: ${error.message}`);
                }
            });
        });

        // Save pallet handler with improved validation
        const handleSavePallet = async () => {
            try {
                const formElements = {
                    name: document.getElementById('palletName'),
                    company_id: document.getElementById('companySelect'),
                    price: document.getElementById('price'),
                    board_thickness: document.getElementById('boardThickness'),
                    upper_board_length: document.getElementById('upperBoardLength'),
                    upper_board_width: document.getElementById('upperBoardWidth'),
                    upper_board_quantity: document.getElementById('upperBoardQuantity'),
                    lower_board_length: document.getElementById('lowerBoardLength'),
                    lower_board_width: document.getElementById('lowerBoardWidth'),
                    lower_board_quantity: document.getElementById('lowerBoardQuantity'),
                    closure_length: document.getElementById('closureLength'),
                    closure_width: document.getElementById('closureWidth'),
                    closure_quantity: document.getElementById('closureQuantity'),
                    block_length: document.getElementById('blockLength'),
                    block_width: document.getElementById('blockWidth'),
                    block_height: document.getElementById('blockHeight')
                };

                // Validate form elements
                const missingElements = Object.entries(formElements)
                    .filter(([_, element]) => !element)
                    .map(([key]) => key);

                if (missingElements.length > 0) {
                    throw new Error(`Form elemanları eksik: ${missingElements.join(', ')}`);
                }

                // Validate required fields
                const emptyFields = Object.entries(formElements)
                    .filter(([_, element]) => !element.value)
                    .map(([key]) => key);

                if (emptyFields.length > 0) {
                    throw new Error(`Lütfen tüm alanları doldurun: ${emptyFields.join(', ')}`);
                }

                const palletId = document.getElementById('palletId')?.value;
                const palletData = {};

                Object.entries(formElements).forEach(([key, element]) => {
                    const value = element.value.trim();
                    if (['price', 'board_thickness', 'upper_board_length', 'upper_board_width',
                         'lower_board_length', 'lower_board_width', 'closure_length', 'closure_width',
                         'block_length', 'block_width', 'block_height'].includes(key)) {
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue < 0) {
                            throw new Error(`Geçersiz ${key} değeri`);
                        }
                        palletData[key] = numValue;
                    } else if (['upper_board_quantity', 'lower_board_quantity', 'closure_quantity'].includes(key)) {
                        const numValue = parseInt(value);
                        if (isNaN(numValue) || numValue < 0) {
                            throw new Error(`Geçersiz ${key} değeri`);
                        }
                        palletData[key] = numValue;
                    } else {
                        palletData[key] = value;
                    }
                });

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
                alert(`Palet kaydetme hatası: ${error.message}`);
            }
        };

        // Add save button event listener with null check
        const saveButton = document.getElementById('savePallet');
        if (saveButton) {
            saveButton.addEventListener('click', handleSavePallet);
        }

        // CRUD operation handlers with improved error handling
        const handleViewPallet = (e) => {
            try {
                const palletId = e.currentTarget.dataset.id;
                if (!palletId) {
                    throw new Error('Palet ID bulunamadı');
                }
                window.location.href = `/pallets/${palletId}`;
            } catch (error) {
                alert(`Palet görüntüleme hatası: ${error.message}`);
            }
        };

        const handleEditPallet = async (e) => {
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

                if (!palletModal) {
                    throw new Error('Modal bileşeni başlatılamadı');
                }
                palletModal.show();
                calculateDesi();
            } catch (error) {
                alert(`Palet düzenleme hatası: ${error.message}`);
            }
        };

        const handleDeletePallet = async (e) => {
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
                alert(`Palet silme hatası: ${error.message}`);
            }
        };

        // Add event listeners to action buttons with null checks
        document.querySelectorAll('.view-pallet').forEach(btn => {
            if (btn) btn.addEventListener('click', handleViewPallet);
        });
        document.querySelectorAll('.edit-pallet').forEach(btn => {
            if (btn) btn.addEventListener('click', handleEditPallet);
        });
        document.querySelectorAll('.delete-pallet').forEach(btn => {
            if (btn) btn.addEventListener('click', handleDeletePallet);
        });

        // Initial filtering
        filterAndSortPallets();
    } catch (error) {
        alert(`Sayfa yüklenirken bir hata oluştu: ${error.message}`);
    }
});
