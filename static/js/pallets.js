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

    // Fetch updated pallet data
    async function fetchPalletData() {
        try {
            const response = await fetch('/api/pallets');
            if (!response.ok) throw new Error('Palet verisi alınamadı');
            return await response.json();
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            throw error;
        }
    }

    // Create table row from pallet data
    function createPalletRow(pallet) {
        const row = document.createElement('tr');
        row.dataset.companyId = pallet.company_id.toString();
        row.dataset.price = pallet.price.toString();
        row.dataset.volume = pallet.total_volume?.toString() || '0';

        row.innerHTML = `
            <td>${pallet.name}</td>
            <td>${pallet.company_name}</td>
            <td>${pallet.price.toFixed(2)}</td>
            <td>${pallet.total_volume || 0}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-info view-pallet" data-id="${pallet.id}" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary edit-pallet" data-id="${pallet.id}" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-pallet" data-id="${pallet.id}" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Add event listeners to the new row's buttons
        row.querySelector('.view-pallet')?.addEventListener('click', handleViewPallet);
        row.querySelector('.edit-pallet')?.addEventListener('click', handleEditPallet);
        row.querySelector('.delete-pallet')?.addEventListener('click', handleDeletePallet);

        return row;
    }

    // Optimized filtering and sorting function
    async function filterAndSortPallets() {
        if (!filterElements.palletsList) {
            console.error('Palet listesi bulunamadı');
            return;
        }

        try {
            console.log('Filtreleme başlatılıyor...');
            const pallets = await fetchPalletData();
            
            const searchText = filterElements.searchName?.value.toLowerCase() || '';
            const companyId = filterElements.filterCompany?.value || '';
            const minPriceValue = parseFloat(filterElements.minPrice?.value) || 0;
            const maxPriceValue = parseFloat(filterElements.maxPrice?.value) || Infinity;
            const [sortKey, sortDir] = (filterElements.sortOrder?.value || 'name_asc').split('_');

            console.log(`Filtre parametreleri:`, {
                searchText,
                companyId,
                minPriceValue,
                maxPriceValue,
                sortKey,
                sortDir
            });

            // Create document fragment for better performance
            const fragment = document.createDocumentFragment();
            let visibleCount = 0;

            // Filter and sort pallets
            const filteredPallets = pallets.filter(pallet => {
                const matchesSearch = !searchText || pallet.name.toLowerCase().includes(searchText);
                const matchesCompany = !companyId || pallet.company_id.toString() === companyId;
                const matchesPrice = pallet.price >= minPriceValue && 
                                   (maxPriceValue === Infinity || pallet.price <= maxPriceValue);

                return matchesSearch && matchesCompany && matchesPrice;
            });

            // Sort filtered pallets
            filteredPallets.sort((a, b) => {
                let aValue, bValue;
                
                switch(sortKey) {
                    case 'name':
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case 'price':
                        aValue = a.price;
                        bValue = b.price;
                        break;
                    case 'volume':
                        aValue = a.total_volume || 0;
                        bValue = b.total_volume || 0;
                        break;
                    default:
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                }

                return sortDir === 'asc' ? 
                    (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) :
                    (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
            });

            // Create and append rows
            filteredPallets.forEach(pallet => {
                fragment.appendChild(createPalletRow(pallet));
                visibleCount++;
            });

            // Clear and update the table efficiently
            filterElements.palletsList.innerHTML = '';
            filterElements.palletsList.appendChild(fragment);

            // Update visibility of no results message
            if (filterElements.noResults) {
                if (visibleCount === 0) {
                    filterElements.noResults.textContent = 'Arama kriterlerinize uygun palet bulunamadı.';
                    filterElements.noResults.classList.remove('d-none');
                } else {
                    filterElements.noResults.classList.add('d-none');
                }
            }

            console.log(`Filtreleme tamamlandı: ${visibleCount} sonuç bulundu`);
        } catch (error) {
            console.error('Filtreleme sırasında hata oluştu:', error);
            if (filterElements.noResults) {
                filterElements.noResults.textContent = 'Filtreleme sırasında bir hata oluştu. Lütfen sayfayı yenileyin ve tekrar deneyin.';
                filterElements.noResults.classList.remove('d-none');
            }
        }
    }

    // Debounced filter function for better performance
    const debouncedFilter = debounce(filterAndSortPallets, 300);

    // Add optimized event listeners for filters
    function initializeFilters() {
        const filterKeys = ['searchName', 'filterCompany', 'minPrice', 'maxPrice', 'sortOrder'];
        
        filterKeys.forEach(key => {
            const element = filterElements[key];
            if (!element) return;

            // Remove existing listeners to prevent duplicates
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            filterElements[key] = newElement;

            // Add new listeners
            if (key === 'filterCompany') {
                newElement.addEventListener('change', (e) => {
                    console.log(`Firma filtresi değişti: ${e.target.value}`);
                    debouncedFilter();
                });
            } else {
                ['input', 'change'].forEach(eventType => {
                    newElement.addEventListener(eventType, (e) => {
                        console.log(`Filtre değişikliği: ${key} - ${e.type}`);
                        debouncedFilter();
                    });
                });
            }
        });
    }

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
                    await filterAndSortPallets(); // Refresh the list instead of reloading
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

    // Initialize the page
    initializeFilters();
    
    const saveButton = document.getElementById('savePallet');
    if (saveButton) {
        saveButton.addEventListener('click', handleSavePallet);
    }

    // Initial filter
    if (filterElements.palletsList) {
        filterAndSortPallets();
    }
});
