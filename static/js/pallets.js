// Initialize filterElements globally
let filterElements;

// Define the filtering and sorting function
const filterAndSortPallets = function() {
    // Only proceed if we're on the pallets page
    const palletsList = document.getElementById('palletsList');
    if (!palletsList) return;

    const searchTerm = filterElements.searchName?.value.toLowerCase() || '';
    const companyId = filterElements.filterCompany?.value || '';
    const minPrice = parseFloat(filterElements.minPrice?.value) || 0;
    const maxPrice = parseFloat(filterElements.maxPrice?.value) || Infinity;
    const sortOrder = filterElements.sortOrder?.value || 'name_asc';

    const items = palletsList.querySelectorAll('.pallet-item');
    let visibleCount = 0;

    // Filter items
    items.forEach(item => {
        const companyMatch = !companyId || item.dataset.companyId === companyId;
        const price = parseFloat(item.dataset.price) || 0;
        const priceMatch = price >= minPrice && (maxPrice === Infinity || price <= maxPrice);
        const nameMatch = item.querySelector('.card-title')
            ?.textContent.toLowerCase().includes(searchTerm);

        if (companyMatch && priceMatch && nameMatch) {
            item.style.display = '';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    try {
        // Convert NodeList to Array for sorting
        const itemsArray = Array.from(items);

        // Sort items
        itemsArray.sort((a, b) => {
            const aValue = a.dataset;
            const bValue = b.dataset;
            
            switch(sortOrder) {
                case 'name_asc':
                    return (a.querySelector('.card-title')?.textContent || '')
                        .localeCompare(b.querySelector('.card-title')?.textContent || '');
                case 'name_desc':
                    return (b.querySelector('.card-title')?.textContent || '')
                        .localeCompare(a.querySelector('.card-title')?.textContent || '');
                case 'price_asc':
                    return (parseFloat(aValue.price) || 0) - (parseFloat(bValue.price) || 0);
                case 'price_desc':
                    return (parseFloat(bValue.price) || 0) - (parseFloat(aValue.price) || 0);
                case 'volume_asc':
                    return (parseFloat(aValue.volume) || 0) - (parseFloat(bValue.volume) || 0);
                case 'volume_desc':
                    return (parseFloat(bValue.volume) || 0) - (parseFloat(aValue.volume) || 0);
                case 'price_per_desi_asc':
                    return (parseFloat(aValue.pricePerDesi) || 0) - (parseFloat(bValue.pricePerDesi) || 0);
                case 'price_per_desi_desc':
                    return (parseFloat(bValue.pricePerDesi) || 0) - (parseFloat(aValue.pricePerDesi) || 0);
                default:
                    return 0;
            }
        });

        // Update DOM with sorted items
        itemsArray.forEach(item => palletsList.appendChild(item));
    } catch (error) {
        console.error('Sıralama hatası:', error);
    }

    // Show/hide no results message
    const noResultsElement = document.getElementById('noResults');
    if (noResultsElement) {
        noResultsElement.classList.toggle('d-none', visibleCount > 0);
    }
};

// Calculate desi values for form
function calculateDesi() {
    try {
        // Only proceed if we're in the pallet form modal
        const palletModal = document.getElementById('palletModal');
        if (!palletModal || !palletModal.classList.contains('show')) return;

        const getInputValue = (id) => {
            const element = document.getElementById(id);
            return element ? parseFloat(element.value) || 0 : 0;
        };

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value.toFixed(2);
            }
        };

        // Get all input values
        const boardThickness = getInputValue('boardThickness');
        const upperLength = getInputValue('upperBoardLength');
        const upperWidth = getInputValue('upperBoardWidth');
        const upperQuantity = getInputValue('upperBoardQuantity');
        
        const lowerLength = getInputValue('lowerBoardLength');
        const lowerWidth = getInputValue('lowerBoardWidth');
        const lowerQuantity = getInputValue('lowerBoardQuantity');
        
        const closureLength = getInputValue('closureLength');
        const closureWidth = getInputValue('closureWidth');
        const closureQuantity = getInputValue('closureQuantity');
        
        const blockLength = getInputValue('blockLength');
        const blockWidth = getInputValue('blockWidth');
        const blockHeight = getInputValue('blockHeight');

        // Calculate volumes
        const upperDesi = (upperLength * upperWidth * boardThickness * upperQuantity) / 1000;
        const lowerDesi = (lowerLength * lowerWidth * boardThickness * lowerQuantity) / 1000;
        const closureDesi = (closureLength * closureWidth * boardThickness * closureQuantity) / 1000;
        const blockDesi = (blockLength * blockWidth * blockHeight * 9) / 1000;
        const totalDesi = upperDesi + lowerDesi + closureDesi + blockDesi;

        // Update UI elements
        updateElement('upperBoardDesi', upperDesi);
        updateElement('lowerBoardDesi', lowerDesi);
        updateElement('closureDesi', closureDesi);
        updateElement('blockDesi', blockDesi);
        updateElement('totalDesi', totalDesi);

        // Calculate and update price per desi if price is available
        const price = getInputValue('price');
        if (price > 0 && totalDesi > 0) {
            const pricePerDesi = price / totalDesi;
            updateElement('pricePerDesi', pricePerDesi);
        }
    } catch (error) {
        console.error('Desi hesaplama hatası:', error);
        // Set default values in case of error
        document.querySelectorAll('[id$="Desi"]').forEach(el => el.textContent = '0.00');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize filter elements only if we're on the pallets page
        const palletsList = document.getElementById('palletsList');
        if (palletsList) {
            filterElements = {
                searchName: document.getElementById('searchName'),
                filterCompany: document.getElementById('filterCompany'),
                minPrice: document.getElementById('minPrice'),
                maxPrice: document.getElementById('maxPrice'),
                sortOrder: document.getElementById('sortOrder')
            };

            // Add filter event listeners only if elements exist
            Object.values(filterElements).forEach(element => {
                if (element) {
                    element.addEventListener('change', filterAndSortPallets);
                    if (element.tagName === 'INPUT') {
                        element.addEventListener('keyup', filterAndSortPallets);
                    }
                }
            });

            // Initial filtering
            filterAndSortPallets();
        }
        
        // Initialize modals and add event listeners for the pallet form
        const palletModal = document.getElementById('palletModal');
        if (palletModal) {
            const desiInputs = [
                'boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
                'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
                'closureLength', 'closureWidth', 'closureQuantity',
                'blockLength', 'blockWidth', 'blockHeight', 'price'
            ];

            desiInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', calculateDesi);
                }
            });

            // Initialize Bootstrap modal
            new bootstrap.Modal(palletModal);

            // Initial calculation when modal is shown
            palletModal.addEventListener('shown.bs.modal', calculateDesi);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }

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

            const palletData = {};
            Object.entries(formElements).forEach(([key, element]) => {
                if (element) {
                    palletData[key] = ['price', 'board_thickness', 'upper_board_length', 'upper_board_width',
                                    'lower_board_length', 'lower_board_width', 'closure_length', 'closure_width',
                                    'block_length', 'block_width', 'block_height'].includes(key) ?
                        parseFloat(element.value) || 0 :
                        ['upper_board_quantity', 'lower_board_quantity', 'closure_quantity'].includes(key) ?
                        parseInt(element.value) || 0 :
                        element.value;
                }
            });

            const response = await fetch(palletId ? `/api/pallets/${palletId}` : '/api/pallets', {
                method: palletId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(palletData)
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Palet kaydedilirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    };

    // Add save button event listener if button exists
    const saveButton = document.getElementById('savePallet');
    if (saveButton) {
        saveButton.addEventListener('click', handleSavePallet);
    }

    // Edit pallet handler
    const handleEditPallet = async (e) => {
        try {
            const palletId = e.currentTarget.dataset.id;
            const response = await fetch(`/api/pallets/${palletId}`);
            if (!response.ok) throw new Error('Palet bilgileri alınamadı');
            
            const pallet = await response.json();
            Object.entries(pallet).forEach(([key, value]) => {
                const element = document.getElementById(key) || 
                              document.getElementById(`pallet${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (element) {
                    element.value = value || '';
                }
            });

            const modalElement = document.getElementById('palletModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
                modal.show();
                calculateDesi();
            }
        } catch (error) {
            console.error('Düzenleme hatası:', error);
            alert('Palet bilgileri yüklenirken bir hata oluştu');
        }
    };

    // Delete pallet handler
    const handleDeletePallet = async (e) => {
        if (confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
            try {
                const palletId = e.currentTarget.dataset.id;
                const response = await fetch(`/api/pallets/${palletId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Palet silinirken bir hata oluştu');
                }
            } catch (error) {
                console.error('Silme hatası:', error);
                alert('İşlem sırasında bir hata oluştu');
            }
        }
    };

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-pallet').forEach(btn => 
        btn.addEventListener('click', handleEditPallet));
    document.querySelectorAll('.delete-pallet').forEach(btn => 
        btn.addEventListener('click', handleDeletePallet));
});
