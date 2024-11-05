// Define error messages in Turkish
const errorMessages = {
    database: 'Veritabanı bağlantı hatası. Lütfen daha sonra tekrar deneyin.',
    validation: 'Geçersiz veri girişi. Lütfen tüm alanları kontrol edin.',
    unauthorized: 'Bu işlem için yetkiniz bulunmamaktadır.',
    notFound: 'İstenen kayıt bulunamadı.',
    default: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
};

// Error handler function
function handleError(error, context) {
    console.error(`[${context}] Hata:`, error);
    let message = error.message || errorMessages.default;

    // Check for specific error types
    if (message.includes('connection')) {
        message = errorMessages.database;
    } else if (message.includes('unauthorized') || message.includes('403')) {
        message = errorMessages.unauthorized;
    } else if (message.includes('not found') || message.includes('404')) {
        message = errorMessages.notFound;
    }

    // Display error to user
    alert(`Hata: ${message}`);
    return false;
}

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
            return;
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

        updateExportLinks();
    } catch (error) {
        handleError(error, 'Filtreleme');
    }
};

// Update export links with current filter parameters
function updateExportLinks() {
    try {
        const params = new URLSearchParams();
        if (filterElements.filterCompany?.value) {
            params.set('company_id', filterElements.filterCompany.value);
        }
        if (filterElements.minPrice?.value) {
            params.set('min_price', filterElements.minPrice.value);
        }
        if (filterElements.maxPrice?.value) {
            params.set('max_price', filterElements.maxPrice.value);
        }
        if (filterElements.searchName?.value) {
            params.set('search', filterElements.searchName.value);
        }

        const pdfLink = document.querySelector('a[href*="export/pallets/pdf"]');
        const csvLink = document.querySelector('a[href*="export/pallets/csv"]');

        if (pdfLink) {
            const baseUrl = pdfLink.href.split('?')[0];
            pdfLink.href = `${baseUrl}?${params.toString()}`;
        }
        if (csvLink) {
            const baseUrl = csvLink.href.split('?')[0];
            csvLink.href = `${baseUrl}?${params.toString()}`;
        }
    } catch (error) {
        handleError(error, 'Dışa aktarma bağlantıları güncelleme');
    }
}

function validatePalletData(data) {
    const requiredFields = {
        'name': 'Palet adı',
        'company_id': 'Firma',
        'price': 'Fiyat',
        'board_thickness': 'Tahta kalınlığı',
        'upper_board_length': 'Üst tahta uzunluğu',
        'upper_board_width': 'Üst tahta genişliği',
        'upper_board_quantity': 'Üst tahta adedi'
        // Add other required fields here
    };

    for (const [field, label] of Object.entries(requiredFields)) {
        if (!data[field]) {
            throw new Error(`${label} alanı boş bırakılamaz`);
        }
    }

    // Validate numeric values
    const numericFields = ['price', 'board_thickness', 'upper_board_length', 'upper_board_width'];
    for (const field of numericFields) {
        if (isNaN(parseFloat(data[field])) || parseFloat(data[field]) <= 0) {
            throw new Error(`${requiredFields[field]} için geçerli bir değer giriniz`);
        }
    }

    return true;
}

// Save pallet handler with improved validation and error handling
async function handleSavePallet() {
    try {
        const palletData = {
            name: document.getElementById('palletName')?.value?.trim(),
            company_id: parseInt(document.getElementById('companySelect')?.value),
            price: parseFloat(document.getElementById('price')?.value) || 0,
            board_thickness: parseFloat(document.getElementById('boardThickness')?.value) || 0,
            upper_board_length: parseFloat(document.getElementById('upperBoardLength')?.value) || 0,
            upper_board_width: parseFloat(document.getElementById('upperBoardWidth')?.value) || 0,
            upper_board_quantity: parseInt(document.getElementById('upperBoardQuantity')?.value) || 0,
            lower_board_length: parseFloat(document.getElementById('lowerBoardLength')?.value) || 0,
            lower_board_width: parseFloat(document.getElementById('lowerBoardWidth')?.value) || 0,
            lower_board_quantity: parseInt(document.getElementById('lowerBoardQuantity')?.value) || 0,
            closure_length: parseFloat(document.getElementById('closureLength')?.value) || 0,
            closure_width: parseFloat(document.getElementById('closureWidth')?.value) || 0,
            closure_quantity: parseInt(document.getElementById('closureQuantity')?.value) || 0,
            block_length: parseFloat(document.getElementById('blockLength')?.value) || 0,
            block_width: parseFloat(document.getElementById('blockWidth')?.value) || 0,
            block_height: parseFloat(document.getElementById('blockHeight')?.value) || 0
        };

        // Validate the data
        validatePalletData(palletData);

        const palletId = document.getElementById('palletId')?.value;
        const response = await fetch(palletId ? `/api/pallets/${palletId}` : '/api/pallets', {
            method: palletId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(palletData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Palet kaydedilirken bir hata oluştu');
        }

        window.location.reload();
    } catch (error) {
        handleError(error, 'Palet kaydetme');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize Bootstrap components and event listeners
        const palletModalElement = document.getElementById('palletModal');
        if (!palletModalElement) {
            throw new Error('Palet modal elementi bulunamadı');
        }
        
        // ... rest of the initialization code ...
        
    } catch (error) {
        handleError(error, 'Sayfa yükleme');
    }
});

// ... rest of the event handlers with try-catch blocks ...
