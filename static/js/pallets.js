// Filter and sort utility functions
function getSortValue(item, sortOrder) {
    if (sortOrder.startsWith('name')) {
        const nameText = item.querySelector('td:first-child, .accordion-button')?.textContent.toLowerCase() || '';
        return nameText;
    }
    if (sortOrder.includes('price')) {
        return parseFloat(item.dataset.price) || 0;
    }
    if (sortOrder.includes('volume')) {
        return parseFloat(item.dataset.volume) || 0;
    }
    return 0;
}

// Main filter and sort function
window.filterAndSortPallets = function() {
    try {
        const searchTerm = document.getElementById('searchName')?.value.toLowerCase() || '';
        const companyId = document.getElementById('filterCompany')?.value || '';
        const minPrice = parseFloat(document.getElementById('minPrice')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || Infinity;
        const sortOrder = document.getElementById('sortOrder')?.value;

        const palletsList = document.getElementById('palletsList');
        const palletsAccordion = document.getElementById('palletsAccordion');
        const noResults = document.getElementById('noResults');

        let items = [];
        if (palletsList) {
            items = Array.from(palletsList.getElementsByTagName('tr'));
        } else if (palletsAccordion) {
            items = Array.from(palletsAccordion.getElementsByClassName('accordion-item'));
        }

        let visibleCount = 0;

        items.forEach(item => {
            const itemName = item.querySelector('td:first-child, .accordion-button')?.textContent.toLowerCase() || '';
            const itemCompanyId = item.dataset.companyId;
            const itemPrice = parseFloat(item.dataset.price) || 0;

            const matchesSearch = itemName.includes(searchTerm);
            const matchesCompany = !companyId || itemCompanyId === companyId;
            const matchesPrice = itemPrice >= minPrice && (!maxPrice || itemPrice <= maxPrice);

            const isVisible = matchesSearch && matchesCompany && matchesPrice;
            if (isVisible) visibleCount++;

            item.style.display = isVisible ? '' : 'none';
        });

        if (visibleCount > 0 && sortOrder) {
            const sortedItems = Array.from(items)
                .filter(item => item.style.display !== 'none')
                .sort((a, b) => {
                    const aValue = getSortValue(a, sortOrder);
                    const bValue = getSortValue(b, sortOrder);
                    if (typeof aValue === 'string') {
                        return sortOrder.includes('desc') ? 
                            bValue.localeCompare(aValue, 'tr') : 
                            aValue.localeCompare(bValue, 'tr');
                    }
                    return sortOrder.includes('desc') ? bValue - aValue : aValue - bValue;
                });

            const container = palletsList || palletsAccordion;
            if (container) {
                sortedItems.forEach(item => container.appendChild(item));
            }
        }

        if (noResults) {
            noResults.classList.toggle('d-none', visibleCount > 0);
        }

        // Update export links with current filter parameters
        updateExportLinks();
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
}

// Update export links with current filter parameters
function updateExportLinks() {
    try {
        const searchTerm = document.getElementById('searchName')?.value || '';
        const companyId = document.getElementById('filterCompany')?.value || '';
        const minPrice = document.getElementById('minPrice')?.value || '';
        const maxPrice = document.getElementById('maxPrice')?.value || '';

        const params = new URLSearchParams({
            search: searchTerm,
            company_id: companyId,
            min_price: minPrice,
            max_price: maxPrice
        });

        const pdfLink = document.querySelector('a[href*="/export/pallets/pdf"]');
        const csvLink = document.querySelector('a[href*="/export/pallets/csv"]');

        if (pdfLink) {
            pdfLink.href = `/export/pallets/pdf?${params.toString()}`;
        }
        if (csvLink) {
            csvLink.href = `/export/pallets/csv?${params.toString()}`;
        }
    } catch (error) {
        console.error('Export link güncelleme hatası:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for filters
    const filterElements = [
        'searchName',
        'filterCompany',
        'minPrice',
        'maxPrice',
        'sortOrder'
    ];

    filterElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', filterAndSortPallets);
            element.addEventListener('change', filterAndSortPallets);
        }
    });

    // Initialize filtering on load
    filterAndSortPallets();

    // Add save button click handler with improved error logging
    const saveButton = document.getElementById('savePallet');
    if (saveButton) {
        console.log('Save button found, attaching event listener');
        saveButton.addEventListener('click', handleSavePallet);
    } else {
        console.error('Save button not found in the DOM');
    }

    // Add event listeners for real-time desi calculations
    const dimensionInputs = [
        'boardThickness',
        'upperBoardLength', 'upperBoardWidth', 'upperBoardQuantity',
        'lowerBoardLength', 'lowerBoardWidth', 'lowerBoardQuantity',
        'closureLength', 'closureWidth', 'closureQuantity',
        'blockLength', 'blockWidth', 'blockHeight'
    ];

    dimensionInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', calculateDesi);
        } else {
            console.warn(`Input field ${inputId} not found`);
        }
    });
});

[rest of the file remains unchanged...]
