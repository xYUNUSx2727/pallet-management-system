// Define the filtering function first
const filterAndSortPallets = function() {
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

    filterElements.noResults.classList.toggle('d-none', visibleCount > 0);
};

document.addEventListener('DOMContentLoaded', function() {
    // Filter elements with null checks
    const filterElements = {
        searchName: document.getElementById('searchName'),
        filterCompany: document.getElementById('filterCompany'),
        minPrice: document.getElementById('minPrice'),
        maxPrice: document.getElementById('maxPrice'),
        sortOrder: document.getElementById('sortOrder'),
        noResults: document.getElementById('noResults'),
        palletsList: document.getElementById('palletsList'),
        palletsAccordion: document.getElementById('palletsAccordion')
    };

    // Add filter event listeners right after filterElements definition
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
                    parseFloat(element.value) :
                    ['upper_board_quantity', 'lower_board_quantity', 'closure_quantity'].includes(key) ?
                    parseInt(element.value) :
                    element.value;
            }
        });

        try {
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
            console.error('Hata:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    };

    // Add save button event listener
    document.getElementById('savePallet')?.addEventListener('click', handleSavePallet);

    // CRUD operation handlers
    const handleViewPallet = (e) => {
        const palletId = e.currentTarget.dataset.id;
        window.location.href = `/pallets/${palletId}`;
    };

    const handleEditPallet = async (e) => {
        const palletId = e.currentTarget.dataset.id;
        try {
            const response = await fetch(`/api/pallets/${palletId}`);
            if (!response.ok) throw new Error('Palet bilgileri alınamadı');
            
            const pallet = await response.json();
            Object.entries(pallet).forEach(([key, value]) => {
                const element = document.getElementById(key) || 
                              document.getElementById(`pallet${key.charAt(0).toUpperCase() + key.slice(1)}`);
                if (element) {
                    element.value = value;
                }
            });

            palletModal?.show();
        } catch (error) {
            console.error('Hata:', error);
            alert('Palet bilgileri yüklenirken bir hata oluştu');
        }
    };

    const handleDeletePallet = async (e) => {
        if (confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
            const palletId = e.currentTarget.dataset.id;
            try {
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
                console.error('Hata:', error);
                alert('İşlem sırasında bir hata oluştu');
            }
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
});
