// Initialize filterElements globally
let filterElements;

// Define the filtering function
const filterAndSortPallets = function() {
    try {
        const searchTerm = filterElements.searchName?.value.toLowerCase() || '';
        const companyId = filterElements.filterCompany?.value || '';
        const minPrice = parseFloat(filterElements.minPrice?.value) || 0;
        const maxPrice = parseFloat(filterElements.maxPrice?.value) || Infinity;
        const sortOrder = filterElements.sortOrder?.value || 'name_asc';

        const items = document.querySelectorAll('tr[data-company-id], .accordion-item');
        let visibleCount = 0;

        items.forEach(item => {
            const companyMatch = !companyId || item.dataset.companyId === companyId;
            const price = parseFloat(item.dataset.price);
            const priceMatch = price >= minPrice && (maxPrice === Infinity || price <= maxPrice);
            const nameMatch = item.querySelector('td:first-child, .accordion-button')
                ?.textContent.toLowerCase().includes(searchTerm);

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
        console.error('Filtreleme sırasında hata oluştu:', error.message);
    }
};

function calculateDesi() {
    try {
        // Get values from inputs
        const boardThickness = parseFloat(document.getElementById('boardThickness')?.value) || 0;
        const upperLength = parseFloat(document.getElementById('upperBoardLength')?.value) || 0;
        const upperWidth = parseFloat(document.getElementById('upperBoardWidth')?.value) || 0;
        const upperQuantity = parseInt(document.getElementById('upperBoardQuantity')?.value) || 0;
        
        const lowerLength = parseFloat(document.getElementById('lowerBoardLength')?.value) || 0;
        const lowerWidth = parseFloat(document.getElementById('lowerBoardWidth')?.value) || 0;
        const lowerQuantity = parseInt(document.getElementById('lowerBoardQuantity')?.value) || 0;
        
        const closureLength = parseFloat(document.getElementById('closureLength')?.value) || 0;
        const closureWidth = parseFloat(document.getElementById('closureWidth')?.value) || 0;
        const closureQuantity = parseInt(document.getElementById('closureQuantity')?.value) || 0;
        
        const blockLength = parseFloat(document.getElementById('blockLength')?.value) || 0;
        const blockWidth = parseFloat(document.getElementById('blockWidth')?.value) || 0;
        const blockHeight = parseFloat(document.getElementById('blockHeight')?.value) || 0;

        // Calculate volumes
        const upperDesi = (upperLength * upperWidth * boardThickness * upperQuantity) / 1000;
        const lowerDesi = (lowerLength * lowerWidth * boardThickness * lowerQuantity) / 1000;
        const closureDesi = (closureLength * closureWidth * boardThickness * closureQuantity) / 1000;
        const blockDesi = (blockLength * blockWidth * blockHeight * 9) / 1000;
        const totalDesi = upperDesi + lowerDesi + closureDesi + blockDesi;

        // Update UI with null checks
        const elements = {
            'upperBoardDesi': upperDesi,
            'lowerBoardDesi': lowerDesi,
            'closureDesi': closureDesi,
            'blockDesi': blockDesi,
            'totalDesi': totalDesi
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toFixed(2);
            }
        });
    } catch (error) {
        console.error('Desi hesaplama sırasında hata oluştu:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize filter elements with null checks
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
        const inputs = ['boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
                        'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
                        'closureLength', 'closureWidth', 'closureQuantity',
                        'blockLength', 'blockWidth', 'blockHeight'];

        inputs.forEach(id => {
            document.getElementById(id)?.addEventListener('input', calculateDesi);
        });

        // Add filter event listeners
        Object.values(filterElements).forEach(element => {
            if (element && element.id !== 'noResults' && element.id !== 'palletsList') {
                element.addEventListener('change', filterAndSortPallets);
                if (element.tagName === 'INPUT') {
                    element.addEventListener('keyup', filterAndSortPallets);
                }
            }
        });

        // Initialize Bootstrap components
        const palletModal = document.getElementById('palletModal') ? 
            new bootstrap.Modal(document.getElementById('palletModal')) : null;

        // Initialize accordions
        document.querySelectorAll('.accordion-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = document.querySelector(e.target.dataset.bsTarget);
                if (target) {
                    new bootstrap.Collapse(target);
                }
            });
        });

        // Save pallet handler
        const handleSavePallet = async () => {
            try {
                const palletId = document.getElementById('palletId')?.value;
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

                // Validate required fields
                const missingFields = Object.entries(formElements)
                    .filter(([_, element]) => element && !element.value)
                    .map(([key]) => key);

                if (missingFields.length > 0) {
                    throw new Error(`Lütfen tüm alanları doldurun: ${missingFields.join(', ')}`);
                }

                const palletData = {};
                Object.entries(formElements).forEach(([key, element]) => {
                    if (element) {
                        palletData[key] = ['price', 'board_thickness', 'upper_board_length', 'upper_board_width',
                                        'lower_board_length', 'lower_board_width', 'closure_length', 'closure_width',
                                        'block_length', 'block_width', 'block_height'].includes(key) ?
                            parseFloat(element.value) :
                            ['upper_board_quantity', 'lower_board_quantity', 'closure_quantity'].includes(key) ?
                            parseInt(element.value) :
                            element.value;
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
                console.error('Palet kaydetme hatası:', error.message);
                alert(error.message);
            }
        };

        // Add save button event listener
        document.getElementById('savePallet')?.addEventListener('click', handleSavePallet);

        // CRUD operation handlers
        const handleViewPallet = (e) => {
            try {
                const palletId = e.currentTarget.dataset.id;
                window.location.href = `/pallets/${palletId}`;
            } catch (error) {
                console.error('Palet görüntüleme hatası:', error.message);
            }
        };

        const handleEditPallet = async (e) => {
            try {
                const palletId = e.currentTarget.dataset.id;
                const response = await fetch(`/api/pallets/${palletId}`);
                
                if (!response.ok) {
                    throw new Error('Palet bilgileri alınamadı');
                }
                
                const pallet = await response.json();
                Object.entries(pallet).forEach(([key, value]) => {
                    const element = document.getElementById(key) || 
                                document.getElementById(`pallet${key.charAt(0).toUpperCase() + key.slice(1)}`);
                    if (element) {
                        element.value = value;
                    }
                });

                palletModal?.show();
                calculateDesi(); // Calculate and display desi values when editing
            } catch (error) {
                console.error('Palet düzenleme hatası:', error.message);
                alert('Palet bilgileri yüklenirken bir hata oluştu: ' + error.message);
            }
        };

        const handleDeletePallet = async (e) => {
            try {
                if (!confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
                    return;
                }

                const palletId = e.currentTarget.dataset.id;
                const response = await fetch(`/api/pallets/${palletId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Palet silinirken bir hata oluştu');
                }

                window.location.reload();
            } catch (error) {
                console.error('Palet silme hatası:', error.message);
                alert('Palet silinirken bir hata oluştu: ' + error.message);
            }
        };

        // Add event listeners to action buttons
        document.querySelectorAll('.view-pallet').forEach(btn => 
            btn.addEventListener('click', handleViewPallet));
        document.querySelectorAll('.edit-pallet').forEach(btn => 
            btn.addEventListener('click', handleEditPallet));
        document.querySelectorAll('.delete-pallet').forEach(btn => 
            btn.addEventListener('click', handleDeletePallet));

        // Initial filtering
        filterAndSortPallets();
    } catch (error) {
        console.error('Sayfa yüklenirken bir hata oluştu:', error.message);
    }
});
