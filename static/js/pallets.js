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

    // Form validation
    function validateFormData(data) {
        const errors = [];
        
        if (!data.name) errors.push('Palet adı gereklidir');
        if (!data.company_id) errors.push('Firma seçimi gereklidir');
        if (data.price < 0) errors.push('Fiyat 0\'dan küçük olamaz');
        
        // Validate dimensions
        const dimensions = {
            'Tahta kalınlığı': data.board_thickness,
            'Üst tahta uzunluğu': data.upper_board_length,
            'Üst tahta genişliği': data.upper_board_width,
            'Üst tahta adedi': data.upper_board_quantity,
            'Alt tahta uzunluğu': data.lower_board_length,
            'Alt tahta genişliği': data.lower_board_width,
            'Alt tahta adedi': data.lower_board_quantity,
            'Kapatma uzunluğu': data.closure_length,
            'Kapatma genişliği': data.closure_width,
            'Kapatma adedi': data.closure_quantity,
            'Takoz uzunluğu': data.block_length,
            'Takoz genişliği': data.block_width,
            'Takoz yüksekliği': data.block_height
        };

        Object.entries(dimensions).forEach(([name, value]) => {
            if (!value || value <= 0) errors.push(`${name} 0'dan büyük olmalıdır`);
        });
        
        return errors;
    }

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

    // Save pallet handler
    async function handleSavePallet() {
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

        const errors = validateFormData(palletData);
        if (errors.length > 0) {
            alert('Lütfen aşağıdaki hataları düzeltin:\n\n' + errors.join('\n'));
            return;
        }

        try {
            const response = await fetch(palletId ? `/api/pallets/${palletId}` : '/api/pallets', {
                method: palletId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(palletData)
            });

            if (response.ok) {
                location.reload();
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Palet kaydedilirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Hata:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    }

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
