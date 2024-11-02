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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Firma kaydedilirken bir hata oluştu');
            }
        } catch (error) {
            alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
        }
    });

    // Edit Company
    document.querySelectorAll('.edit-company').forEach(button => {
        button.addEventListener('click', async (e) => {
            try {
                const companyId = e.target.dataset.id;
                if (!companyId) {
                    throw new Error('Firma ID bulunamadı');
                }

                const response = await fetch(`/api/companies/${companyId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Firma bilgileri alınamadı');
                }

                const company = await response.json();
                document.getElementById('companyId').value = company.id;
                document.getElementById('companyName').value = company.name;
                document.getElementById('companyEmail').value = company.contact_email;

                companyModal.show();
            } catch (error) {
                alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
            }
        });
    });

    // Delete Company
    document.querySelectorAll('.delete-company').forEach(button => {
        button.addEventListener('click', async (e) => {
            try {
                if (!confirm('Bu firmayı silmek istediğinizden emin misiniz?')) {
                    return;
                }

                const companyId = e.target.dataset.id;
                if (!companyId) {
                    throw new Error('Firma ID bulunamadı');
                }

                const response = await fetch(`/api/companies/${companyId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Firma silinirken bir hata oluştu');
                }

                location.reload();
            } catch (error) {
                alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
            }
        });
    });
});
