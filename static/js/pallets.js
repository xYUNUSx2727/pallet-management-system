document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components and elements
    const palletModal = document.getElementById('palletModal') ? 
        new bootstrap.Modal(document.getElementById('palletModal')) : null;

    // Filter elements with null checks
    const filterElements = {
        searchName: document.getElementById('searchName'),
        filterCompany: document.getElementById('filterCompany'),
        minPrice: document.getElementById('minPrice'),
        maxPrice: document.getElementById('maxPrice'),
        sortOrder: document.getElementById('sortOrder'),
        noResults: document.getElementById('noResults'),
        palletsList: document.getElementById('palletsList')
    };

    // Desi calculation functions
    function calculateDesi(length, width, height, quantity = 1) {
        if (!length || !width || !height || !quantity) return 0;
        return ((length * width * height * quantity) / 1000).toFixed(2);
    }

    function updateDesiCalculations() {
        const formElements = {
            boardThickness: document.getElementById('boardThickness'),
            upperLength: document.getElementById('upperBoardLength'),
            upperWidth: document.getElementById('upperBoardWidth'),
            upperQuantity: document.getElementById('upperBoardQuantity'),
            lowerLength: document.getElementById('lowerBoardLength'),
            lowerWidth: document.getElementById('lowerBoardWidth'),
            lowerQuantity: document.getElementById('lowerBoardQuantity'),
            closureLength: document.getElementById('closureLength'),
            closureWidth: document.getElementById('closureWidth'),
            closureQuantity: document.getElementById('closureQuantity'),
            blockLength: document.getElementById('blockLength'),
            blockWidth: document.getElementById('blockWidth'),
            blockHeight: document.getElementById('blockHeight')
        };

        const desiElements = {
            upperDesi: document.getElementById('upperBoardDesi'),
            lowerDesi: document.getElementById('lowerBoardDesi'),
            closureDesi: document.getElementById('closureDesi'),
            blockDesi: document.getElementById('blockDesi')
        };

        if (formElements.boardThickness) {
            const thickness = parseFloat(formElements.boardThickness.value) || 0;

            // Upper boards
            if (desiElements.upperDesi && formElements.upperLength && formElements.upperWidth && formElements.upperQuantity) {
                const upperDesi = calculateDesi(
                    parseFloat(formElements.upperLength.value),
                    parseFloat(formElements.upperWidth.value),
                    thickness,
                    parseInt(formElements.upperQuantity.value)
                );
                desiElements.upperDesi.textContent = upperDesi;
            }

            // Lower boards
            if (desiElements.lowerDesi && formElements.lowerLength && formElements.lowerWidth && formElements.lowerQuantity) {
                const lowerDesi = calculateDesi(
                    parseFloat(formElements.lowerLength.value),
                    parseFloat(formElements.lowerWidth.value),
                    thickness,
                    parseInt(formElements.lowerQuantity.value)
                );
                desiElements.lowerDesi.textContent = lowerDesi;
            }

            // Closure boards
            if (desiElements.closureDesi && formElements.closureLength && formElements.closureWidth && formElements.closureQuantity) {
                const closureDesi = calculateDesi(
                    parseFloat(formElements.closureLength.value),
                    parseFloat(formElements.closureWidth.value),
                    thickness,
                    parseInt(formElements.closureQuantity.value)
                );
                desiElements.closureDesi.textContent = closureDesi;
            }
        }

        // Blocks (fixed 9 pieces)
        if (desiElements.blockDesi && formElements.blockLength && formElements.blockWidth && formElements.blockHeight) {
            const blockDesi = calculateDesi(
                parseFloat(formElements.blockLength.value),
                parseFloat(formElements.blockWidth.value),
                parseFloat(formElements.blockHeight.value),
                9
            );
            desiElements.blockDesi.textContent = blockDesi;
        }
    }

    // Add desi calculation listeners
    const dimensionInputs = [
        'boardThickness', 'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
        'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
        'closureLength', 'closureWidth', 'closureQuantity',
        'blockLength', 'blockWidth', 'blockHeight'
    ];

    dimensionInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', updateDesiCalculations);
        }
    });

    // Filtering and sorting function
    function filterAndSortPallets() {
        if (!filterElements.palletsList) return;

        const rows = Array.from(filterElements.palletsList.querySelectorAll('tr'));
        const searchText = filterElements.searchName?.value.toLowerCase() || '';
        const companyId = filterElements.filterCompany?.value || '';
        const minPriceValue = parseFloat(filterElements.minPrice?.value) || 0;
        const maxPriceValue = parseFloat(filterElements.maxPrice?.value) || Infinity;
        const [sortKey, sortDir] = (filterElements.sortOrder?.value || 'name_asc').split('_');

        const visibleRows = rows.filter(row => {
            if (!row.children.length) return false;
            
            const name = row.children[0].textContent.toLowerCase();
            const rowCompanyId = row.dataset.companyId;
            const price = parseFloat(row.dataset.price) || 0;

            const matchesSearch = !searchText || name.includes(searchText);
            const matchesCompany = !companyId || rowCompanyId === companyId;
            const matchesPrice = price >= minPriceValue && price <= maxPriceValue;

            return matchesSearch && matchesCompany && matchesPrice;
        });

        // Sorting
        visibleRows.sort((a, b) => {
            let aValue, bValue;
            
            switch(sortKey) {
                case 'name':
                    aValue = a.children[0].textContent.toLowerCase();
                    bValue = b.children[0].textContent.toLowerCase();
                    break;
                case 'price':
                    aValue = parseFloat(a.dataset.price) || 0;
                    bValue = parseFloat(b.dataset.price) || 0;
                    break;
                case 'volume':
                    aValue = parseFloat(a.dataset.volume) || 0;
                    bValue = parseFloat(b.dataset.volume) || 0;
                    break;
                default:
                    aValue = a.children[0].textContent.toLowerCase();
                    bValue = b.children[0].textContent.toLowerCase();
            }

            const sortMultiplier = sortDir === 'asc' ? 1 : -1;
            return sortMultiplier * (aValue < bValue ? -1 : aValue > bValue ? 1 : 0);
        });

        // Update visibility
        filterElements.palletsList.innerHTML = '';
        visibleRows.forEach(row => filterElements.palletsList.appendChild(row));
        
        if (filterElements.noResults) {
            filterElements.noResults.classList.toggle('d-none', visibleRows.length > 0);
        }
    }

    // Add event listeners for filters
    Object.entries(filterElements).forEach(([key, element]) => {
        if (element && ['searchName', 'filterCompany', 'minPrice', 'maxPrice', 'sortOrder'].includes(key)) {
            ['input', 'change'].forEach(eventType => {
                element.addEventListener(eventType, filterAndSortPallets);
            });
        }
    });

    // Button event handlers
    async function handleEditPallet(e) {
        const palletId = e.currentTarget.dataset.id;
        try {
            const response = await fetch(`/api/pallets/${palletId}`);
            if (!response.ok) throw new Error('Palet bilgileri alınamadı');
            
            const pallet = await response.json();
            
            // Set form values
            const formElements = {
                palletId: document.getElementById('palletId'),
                name: document.getElementById('palletName'),
                companySelect: document.getElementById('companySelect'),
                price: document.getElementById('price'),
                boardThickness: document.getElementById('boardThickness'),
                upperBoardLength: document.getElementById('upperBoardLength'),
                upperBoardWidth: document.getElementById('upperBoardWidth'),
                upperBoardQuantity: document.getElementById('upperBoardQuantity'),
                lowerBoardLength: document.getElementById('lowerBoardLength'),
                lowerBoardWidth: document.getElementById('lowerBoardWidth'),
                lowerBoardQuantity: document.getElementById('lowerBoardQuantity'),
                closureLength: document.getElementById('closureLength'),
                closureWidth: document.getElementById('closureWidth'),
                closureQuantity: document.getElementById('closureQuantity'),
                blockLength: document.getElementById('blockLength'),
                blockWidth: document.getElementById('blockWidth'),
                blockHeight: document.getElementById('blockHeight')
            };

            Object.entries(formElements).forEach(([key, element]) => {
                if (element && pallet[key]) {
                    element.value = pallet[key];
                }
            });

            updateDesiCalculations();
            if (palletModal) palletModal.show();
        } catch (error) {
            console.error('Hata:', error);
            alert('Palet bilgileri yüklenirken bir hata oluştu');
        }
    }

    async function handleDeletePallet(e) {
        if (confirm('Bu paleti silmek istediğinizden emin misiniz?')) {
            const palletId = e.currentTarget.dataset.id;
            try {
                const response = await fetch(`/api/pallets/${palletId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    location.reload();
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Palet silinirken bir hata oluştu');
                }
            } catch (error) {
                console.error('Hata:', error);
                alert('İşlem sırasında bir hata oluştu');
            }
        }
    }

    function handleViewPallet(e) {
        const palletId = e.currentTarget.dataset.id;
        window.location.href = `/pallets/${palletId}`;
    }

    // Initialize button event listeners
    function initializeButtons() {
        // Edit buttons
        document.querySelectorAll('.edit-pallet').forEach(button => {
            button.addEventListener('click', handleEditPallet);
        });

        // Delete buttons
        document.querySelectorAll('.delete-pallet').forEach(button => {
            button.addEventListener('click', handleDeletePallet);
        });

        // View buttons
        document.querySelectorAll('.view-pallet').forEach(button => {
            button.addEventListener('click', handleViewPallet);
        });

        // Save button
        const saveButton = document.getElementById('savePallet');
        if (saveButton) {
            saveButton.addEventListener('click', handleSavePallet);
        }
    }

    // Initialize buttons
    initializeButtons();

    // Initial filter
    if (filterElements.palletsList) {
        filterAndSortPallets();
    }
});
