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
        palletsList: document.getElementById('palletsList'),
        palletsAccordion: document.getElementById('palletsAccordion')
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

    // Create accordion item from pallet data
    function createAccordionItem(pallet) {
        const accordionId = `pallet${pallet.id}`;
        const item = document.createElement('div');
        item.className = 'accordion-item';
        item.dataset.companyId = pallet.company_id.toString();
        item.dataset.price = pallet.price.toString();
        item.dataset.volume = pallet.total_volume?.toString() || '0';

        item.innerHTML = `
            <h2 class="accordion-header" id="heading${pallet.id}">
                <button class="accordion-button collapsed" type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#${accordionId}">
                    <div class="d-flex justify-content-between w-100 align-items-center">
                        <span class="pallet-name">${pallet.name}</span>
                        <span class="badge bg-primary ms-2">${pallet.price.toFixed(2)} TL</span>
                    </div>
                </button>
            </h2>
            <div id="${accordionId}" class="accordion-collapse collapse" 
                 data-bs-parent="#palletsAccordion">
                <div class="accordion-body">
                    <div class="pallet-info">
                        <div class="info-group">
                            <label>Firma:</label>
                            <span>${pallet.company_name}</span>
                        </div>
                        <div class="info-group">
                            <label>Hacim:</label>
                            <span>${pallet.total_volume || 0} desi</span>
                        </div>
                    </div>
                    
                    <div class="dimensions-section">
                        <h6>Üst Tahta</h6>
                        <div class="dimensions-info">
                            <div>Uzunluk: ${pallet.upper_board_length} cm</div>
                            <div>Genişlik: ${pallet.upper_board_width} cm</div>
                            <div>Adet: ${pallet.upper_board_quantity}</div>
                        </div>

                        <h6>Alt Tahta</h6>
                        <div class="dimensions-info">
                            <div>Uzunluk: ${pallet.lower_board_length} cm</div>
                            <div>Genişlik: ${pallet.lower_board_width} cm</div>
                            <div>Adet: ${pallet.lower_board_quantity}</div>
                        </div>

                        <h6>Kapatma</h6>
                        <div class="dimensions-info">
                            <div>Uzunluk: ${pallet.closure_length} cm</div>
                            <div>Genişlik: ${pallet.closure_width} cm</div>
                            <div>Adet: ${pallet.closure_quantity}</div>
                        </div>

                        <h6>Takoz (9 adet)</h6>
                        <div class="dimensions-info">
                            <div>Uzunluk: ${pallet.block_length} cm</div>
                            <div>Genişlik: ${pallet.block_width} cm</div>
                            <div>Yükseklik: ${pallet.block_height} cm</div>
                        </div>
                    </div>

                    <div class="actions mt-3">
                        <div class="btn-group w-100">
                            <button class="btn btn-info view-pallet" data-id="${pallet.id}">
                                <i class="fas fa-eye me-1"></i>Görüntüle
                            </button>
                            <button class="btn btn-secondary edit-pallet" data-id="${pallet.id}">
                                <i class="fas fa-edit me-1"></i>Düzenle
                            </button>
                            <button class="btn btn-danger delete-pallet" data-id="${pallet.id}">
                                <i class="fas fa-trash me-1"></i>Sil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const buttons = {
            view: item.querySelector('.view-pallet'),
            edit: item.querySelector('.edit-pallet'),
            delete: item.querySelector('.delete-pallet')
        };

        buttons.view?.addEventListener('click', handleViewPallet);
        buttons.edit?.addEventListener('click', handleEditPallet);
        buttons.delete?.addEventListener('click', handleDeletePallet);

        return item;
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
            <td class="pallet-dimensions">
                <div class="dimensions-group">
                    <span class="dimension-label">Üst:</span>
                    <span>${pallet.upper_board_length}x${pallet.upper_board_width}x${pallet.upper_board_quantity}</span>
                </div>
                <div class="dimensions-group">
                    <span class="dimension-label">Alt:</span>
                    <span>${pallet.lower_board_length}x${pallet.lower_board_width}x${pallet.lower_board_quantity}</span>
                </div>
                <div class="dimensions-group">
                    <span class="dimension-label">Kapatma:</span>
                    <span>${pallet.closure_length}x${pallet.closure_width}x${pallet.closure_quantity}</span>
                </div>
                <div class="dimensions-group">
                    <span class="dimension-label">Takoz:</span>
                    <span>${pallet.block_length}x${pallet.block_width}x${pallet.block_height}</span>
                </div>
            </td>
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

        // Add event listeners
        row.querySelector('.view-pallet')?.addEventListener('click', handleViewPallet);
        row.querySelector('.edit-pallet')?.addEventListener('click', handleEditPallet);
        row.querySelector('.delete-pallet')?.addEventListener('click', handleDeletePallet);

        return row;
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

    // Optimized filtering and sorting function
    async function filterAndSortPallets() {
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

            // Filter pallets
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

            // Update desktop view
            if (filterElements.palletsList) {
                const tableFragment = document.createDocumentFragment();
                filteredPallets.forEach(pallet => {
                    tableFragment.appendChild(createPalletRow(pallet));
                });
                filterElements.palletsList.innerHTML = '';
                filterElements.palletsList.appendChild(tableFragment);
            }

            // Update mobile view
            if (filterElements.palletsAccordion) {
                const accordionFragment = document.createDocumentFragment();
                filteredPallets.forEach(pallet => {
                    accordionFragment.appendChild(createAccordionItem(pallet));
                });
                filterElements.palletsAccordion.innerHTML = '';
                filterElements.palletsAccordion.appendChild(accordionFragment);
            }

            // Update no results message
            if (filterElements.noResults) {
                if (filteredPallets.length === 0) {
                    filterElements.noResults.textContent = 'Arama kriterlerinize uygun palet bulunamadı.';
                    filterElements.noResults.classList.remove('d-none');
                } else {
                    filterElements.noResults.classList.add('d-none');
                }
            }

            console.log(`Filtreleme tamamlandı: ${filteredPallets.length} sonuç bulundu`);
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
                    await filterAndSortPallets(); // Refresh both views
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
    filterAndSortPallets();
});
