document.addEventListener('DOMContentLoaded', function() {
    const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
    const companyForm = document.getElementById('companyForm');
    const saveButton = document.getElementById('saveCompany');

    // Add Company
    saveButton.addEventListener('click', async () => {
        const companyId = document.getElementById('companyId').value;
        const companyData = {
            name: document.getElementById('companyName').value,
            contact_email: document.getElementById('companyEmail').value
        };

        const url = companyId ? `/api/companies/${companyId}` : '/api/companies';
        const method = companyId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(companyData)
            });

            if (response.ok) {
                location.reload();
            } else {
                alert('Şirket kaydedilirken bir hata oluştu');
            }
        } catch (error) {
            console.error('Hata:', error);
        }
    });

    // Edit Company
    document.querySelectorAll('.edit-company').forEach(button => {
        button.addEventListener('click', async (e) => {
            const companyId = e.target.dataset.id;
            const response = await fetch(`/api/companies/${companyId}`);
            const company = await response.json();

            document.getElementById('companyId').value = company.id;
            document.getElementById('companyName').value = company.name;
            document.getElementById('companyEmail').value = company.contact_email;

            companyModal.show();
        });
    });

    // Delete Company
    document.querySelectorAll('.delete-company').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (confirm('Bu şirketi silmek istediğinizden emin misiniz?')) {
                const companyId = e.target.dataset.id;
                
                try {
                    const response = await fetch(`/api/companies/${companyId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        location.reload();
                    } else {
                        alert('Şirket silinirken bir hata oluştu');
                    }
                } catch (error) {
                    console.error('Hata:', error);
                }
            }
        });
    });
});
