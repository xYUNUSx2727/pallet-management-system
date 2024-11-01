document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const palletModal = document.getElementById('palletModal') ? 
        new bootstrap.Modal(document.getElementById('palletModal')) : null;

    // Initialize all accordions
    document.querySelectorAll('.accordion-collapse').forEach(collapse => {
        new bootstrap.Collapse(collapse, {
            toggle: false
        });
    });

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
                await filterAndSortPallets();
                palletModal?.hide();
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

    // Rest of the existing code...
    [Previous code continues as is]
