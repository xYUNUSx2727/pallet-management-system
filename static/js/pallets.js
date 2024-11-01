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

    // Debounce function for performance optimization
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

    // Optimized filtering and sorting function
    function filterAndSortPallets() {
        if (!filterElements.palletsList) {
            console.error('Palet listesi bulunamadı');
            return;
        }

        try {
            const rows = Array.from(filterElements.palletsList.getElementsByTagName('tr'));
            const searchText = filterElements.searchName?.value.toLowerCase() || '';
            const companyId = filterElements.filterCompany?.value || '';
            const minPriceValue = parseFloat(filterElements.minPrice?.value) || 0;
            const maxPriceValue = parseFloat(filterElements.maxPrice?.value) || Infinity;
            const [sortKey, sortDir] = (filterElements.sortOrder?.value || 'name_asc').split('_');

            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();
            let visibleCount = 0;

            // Filter and sort in a single pass
            rows.sort((a, b) => {
                let aValue, bValue;
                
                switch(sortKey) {
                    case 'name':
                        aValue = a.children[0]?.textContent.toLowerCase();
                        bValue = b.children[0]?.textContent.toLowerCase();
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
                        aValue = a.children[0]?.textContent.toLowerCase();
                        bValue = b.children[0]?.textContent.toLowerCase();
                }

                return sortDir === 'asc' ? 
                    (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
                    (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
            }).forEach(row => {
                if (!row.children.length) return;

                const name = row.children[0].textContent.toLowerCase();
                const rowCompanyId = row.dataset.companyId;
                const price = parseFloat(row.dataset.price) || 0;

                const matchesSearch = !searchText || name.includes(searchText);
                const matchesCompany = !companyId || rowCompanyId === companyId;
                const matchesPrice = price >= minPriceValue && 
                                   (maxPriceValue === Infinity || price <= maxPriceValue);

                if (matchesSearch && matchesCompany && matchesPrice) {
                    fragment.appendChild(row.cloneNode(true));
                    visibleCount++;
                }
            });

            // Clear and update the table efficiently
            filterElements.palletsList.innerHTML = '';
            filterElements.palletsList.appendChild(fragment);

            // Update visibility of no results message
            if (filterElements.noResults) {
                filterElements.noResults.classList.toggle('d-none', visibleCount > 0);
            }

            console.log(`Filtreleme tamamlandı: ${visibleCount} sonuç bulundu`);
        } catch (error) {
            console.error('Filtreleme sırasında hata oluştu:', error);
            if (filterElements.noResults) {
                filterElements.noResults.classList.remove('d-none');
                filterElements.noResults.textContent = 'Filtreleme sırasında bir hata oluştu. Lütfen tekrar deneyin.';
            }
        }
    }

    // Debounced filter function for better performance
    const debouncedFilter = debounce(filterAndSortPallets, 300);

    // Add optimized event listeners for filters
    Object.entries(filterElements).forEach(([key, element]) => {
        if (element && ['searchName', 'filterCompany', 'minPrice', 'maxPrice', 'sortOrder'].includes(key)) {
            ['input', 'change'].forEach(eventType => {
                element.addEventListener(eventType, (e) => {
                    console.log(`Filtre değişikliği: ${key} - ${e.type}`);
                    debouncedFilter();
                });
            });
        }
    });

    // Button event handlers
    const handleEditPallet = async (e) => {
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
    };

    const handleDeletePallet = async (e) => {
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
    };

    const handleViewPallet = (e) => {
        const palletId = e.currentTarget.dataset.id;
        window.location.href = `/pallets/${palletId}`;
    };

    // Initialize button event listeners
    function initializeButtons() {
        document.querySelectorAll('.edit-pallet').forEach(button => {
            button.addEventListener('click', handleEditPallet);
        });

        document.querySelectorAll('.delete-pallet').forEach(button => {
            button.addEventListener('click', handleDeletePallet);
        });

        document.querySelectorAll('.view-pallet').forEach(button => {
            button.addEventListener('click', handleViewPallet);
        });

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
