document.addEventListener('DOMContentLoaded', function() {
    const palletModal = new bootstrap.Modal(document.getElementById('palletModal'));
    const palletForm = document.getElementById('palletForm');
    const saveButton = document.getElementById('savePallet');

    // Filter elements
    const searchName = document.getElementById('searchName');
    const filterCompany = document.getElementById('filterCompany');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const sortOrder = document.getElementById('sortOrder');
    const noResults = document.getElementById('noResults');

    // Filtering and sorting function
    function filterAndSortPallets() {
        const rows = Array.from(document.querySelectorAll('#palletsList tr'));
        const searchText = searchName.value.toLowerCase();
        const companyId = filterCompany.value;
        const minPriceValue = parseFloat(minPrice.value) || 0;
        const maxPriceValue = parseFloat(maxPrice.value) || Infinity;
        const [sortKey, sortDir] = sortOrder.value.split('_');

        let visibleRows = rows.filter(row => {
            const name = row.children[0].textContent.toLowerCase();
            const rowCompanyId = row.dataset.companyId;
            const price = parseFloat(row.dataset.price);

            return name.includes(searchText) &&
                   (!companyId || rowCompanyId === companyId) &&
                   price >= minPriceValue &&
                   price <= maxPriceValue;
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
                    aValue = parseFloat(a.dataset.price);
                    bValue = parseFloat(b.dataset.price);
                    break;
                case 'volume':
                    aValue = parseFloat(a.dataset.volume);
                    bValue = parseFloat(b.dataset.volume);
                    break;
            }

            if (sortDir === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // Update visibility
        const tbody = document.getElementById('palletsList');
        tbody.innerHTML = '';
        visibleRows.forEach(row => tbody.appendChild(row));

        // Show/hide no results message
        noResults.classList.toggle('d-none', visibleRows.length > 0);
    }

    // Add event listeners for filters if elements exist
    [searchName, filterCompany, minPrice, maxPrice, sortOrder].forEach(element => {
        if (element) {
            element.addEventListener('input', filterAndSortPallets);
            element.addEventListener('change', filterAndSortPallets);
        }
    });

    // Form validation
    function validateFormData(data) {
        const errors = [];
        
        if (!data.name) errors.push('Palet adı gereklidir');
        if (!data.company_id) errors.push('Firma seçimi gereklidir');
        if (data.price < 0) errors.push('Fiyat 0\'dan küçük olamaz');
        
        // Validate dimensions (all must be positive)
        if (data.board_thickness <= 0) errors.push('Tahta kalınlığı 0\'dan büyük olmalıdır');
        if (data.upper_board_length <= 0) errors.push('Üst tahta uzunluğu 0\'dan büyük olmalıdır');
        if (data.upper_board_width <= 0) errors.push('Üst tahta genişliği 0\'dan büyük olmalıdır');
        if (data.upper_board_quantity <= 0) errors.push('Üst tahta adedi 0\'dan büyük olmalıdır');
        if (data.lower_board_length <= 0) errors.push('Alt tahta uzunluğu 0\'dan büyük olmalıdır');
        if (data.lower_board_width <= 0) errors.push('Alt tahta genişliği 0\'dan büyük olmalıdır');
        if (data.lower_board_quantity <= 0) errors.push('Alt tahta adedi 0\'dan büyük olmalıdır');
        
        return errors;
    }

    // Add/Edit Pallet
    saveButton.addEventListener('click', async () => {
        const palletId = document.getElementById('palletId').value;
        const palletData = {
            name: document.getElementById('palletName').value,
            company_id: document.getElementById('companySelect').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            board_thickness: parseFloat(document.getElementById('boardThickness').value),
            upper_board_length: parseFloat(document.getElementById('upperBoardLength').value),
            upper_board_width: parseFloat(document.getElementById('upperBoardWidth').value),
            upper_board_quantity: parseInt(document.getElementById('upperBoardQuantity').value),
            lower_board_length: parseFloat(document.getElementById('lowerBoardLength').value),
            lower_board_width: parseFloat(document.getElementById('lowerBoardWidth').value),
            lower_board_quantity: parseInt(document.getElementById('lowerBoardQuantity').value),
            closure_length: parseFloat(document.getElementById('closureLength').value),
            closure_width: parseFloat(document.getElementById('closureWidth').value),
            closure_quantity: parseInt(document.getElementById('closureQuantity').value),
            block_length: parseFloat(document.getElementById('blockLength').value),
            block_width: parseFloat(document.getElementById('blockWidth').value),
            block_height: parseFloat(document.getElementById('blockHeight').value)
        };

        // Validate form data
        const errors = validateFormData(palletData);
        if (errors.length > 0) {
            alert('Lütfen aşağıdaki hataları düzeltin:\n\n' + errors.join('\n'));
            return;
        }

        const url = palletId ? `/api/pallets/${palletId}` : '/api/pallets';
        const method = palletId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
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
            alert('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });

    // Calculate desi values
    function calculateDesi(length, width, height, quantity = 1) {
        if (!length || !width || !height || !quantity) return 0;
        return ((length * width * height * quantity) / 1000).toFixed(2);
    }

    function updateDesiCalculations() {
        try {
            const thickness = parseFloat(document.getElementById('boardThickness').value) || 0;

            // Upper boards
            const upperLength = parseFloat(document.getElementById('upperBoardLength').value) || 0;
            const upperWidth = parseFloat(document.getElementById('upperBoardWidth').value) || 0;
            const upperQuantity = parseInt(document.getElementById('upperBoardQuantity').value) || 0;
            const upperDesi = calculateDesi(upperLength, upperWidth, thickness, upperQuantity);
            const upperDesiElement = document.getElementById('upperBoardDesi');
            if (upperDesiElement) upperDesiElement.textContent = upperDesi;

            // Lower boards
            const lowerLength = parseFloat(document.getElementById('lowerBoardLength').value) || 0;
            const lowerWidth = parseFloat(document.getElementById('lowerBoardWidth').value) || 0;
            const lowerQuantity = parseInt(document.getElementById('lowerBoardQuantity').value) || 0;
            const lowerDesi = calculateDesi(lowerLength, lowerWidth, thickness, lowerQuantity);
            const lowerDesiElement = document.getElementById('lowerBoardDesi');
            if (lowerDesiElement) lowerDesiElement.textContent = lowerDesi;

            // Closure boards
            const closureLength = parseFloat(document.getElementById('closureLength').value) || 0;
            const closureWidth = parseFloat(document.getElementById('closureWidth').value) || 0;
            const closureQuantity = parseInt(document.getElementById('closureQuantity').value) || 0;
            const closureDesi = calculateDesi(closureLength, closureWidth, thickness, closureQuantity);
            const closureDesiElement = document.getElementById('closureDesi');
            if (closureDesiElement) closureDesiElement.textContent = closureDesi;

            // Blocks (fixed 9 quantity)
            const blockLength = parseFloat(document.getElementById('blockLength').value) || 0;
            const blockWidth = parseFloat(document.getElementById('blockWidth').value) || 0;
            const blockHeight = parseFloat(document.getElementById('blockHeight').value) || 0;
            const blockDesi = calculateDesi(blockLength, blockWidth, blockHeight, 9);
            const blockDesiElement = document.getElementById('blockDesi');
            if (blockDesiElement) blockDesiElement.textContent = blockDesi;
        } catch (error) {
            console.error('Desi hesaplama hatası:', error);
        }
    }

    // Add event listeners for real-time desi calculations
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

    // Add placeholder text to all dimension inputs
    dimensionInputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.placeholder = 'cm';
        }
    });

    // Edit Pallet
    document.querySelectorAll('.edit-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
            const palletId = e.currentTarget.dataset.id;
            try {
                const response = await fetch(`/api/pallets/${palletId}`);
                if (!response.ok) {
                    throw new Error('Palet bilgileri alınamadı');
                }
                const pallet = await response.json();

                // Fill form fields
                document.getElementById('palletId').value = pallet.id;
                document.getElementById('palletName').value = pallet.name;
                document.getElementById('companySelect').value = pallet.company_id;
                document.getElementById('price').value = pallet.price;
                
                document.getElementById('boardThickness').value = pallet.board_thickness;
                document.getElementById('upperBoardLength').value = pallet.upper_board_length;
                document.getElementById('upperBoardWidth').value = pallet.upper_board_width;
                document.getElementById('upperBoardQuantity').value = pallet.upper_board_quantity;
                document.getElementById('lowerBoardLength').value = pallet.lower_board_length;
                document.getElementById('lowerBoardWidth').value = pallet.lower_board_width;
                document.getElementById('lowerBoardQuantity').value = pallet.lower_board_quantity;
                document.getElementById('closureLength').value = pallet.closure_length;
                document.getElementById('closureWidth').value = pallet.closure_width;
                document.getElementById('closureQuantity').value = pallet.closure_quantity;
                document.getElementById('blockLength').value = pallet.block_length;
                document.getElementById('blockWidth').value = pallet.block_width;
                document.getElementById('blockHeight').value = pallet.block_height;

                updateDesiCalculations();
                palletModal.show();
            } catch (error) {
                console.error('Hata:', error);
                alert('Palet bilgileri yüklenirken bir hata oluştu');
            }
        });
    });

    // Delete Pallet
    document.querySelectorAll('.delete-pallet').forEach(button => {
        button.addEventListener('click', async (e) => {
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
        });
    });

    // View Pallet Details
    document.querySelectorAll('.view-pallet').forEach(button => {
        button.addEventListener('click', (e) => {
            const palletId = e.currentTarget.dataset.id;
            window.location.href = `/pallets/${palletId}`;
        });
    });

    // Initialize desi calculations for edit mode
    if (document.getElementById('palletModal').classList.contains('show')) {
        updateDesiCalculations();
    }
});
