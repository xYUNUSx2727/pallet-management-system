document.addEventListener('DOMContentLoaded', function() {
    const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
    const companyForm = document.getElementById('companyForm');
    const saveButton = document.getElementById('saveCompany');

    // Add Company
    saveButton.addEventListener('click', async () => {
        try {
            if (!companyForm) {
                throw new Error('Firma formu bulunamadı');
            }

            const nameInput = document.getElementById('companyName');
            const emailInput = document.getElementById('companyEmail');

            if (!nameInput || !emailInput) {
                throw new Error('Form alanları bulunamadı');
            }

            if (!nameInput.value.trim()) {
                throw new Error('Firma adı boş olamaz');
            }

            if (!emailInput.value.trim()) {
                throw new Error('E-posta adresi boş olamaz');
            }

            const companyId = document.getElementById('companyId').value;
            const companyData = {
                name: nameInput.value.trim(),
                contact_email: emailInput.value.trim()
            };

            const url = companyId ? `/api/companies/${companyId}` : '/api/companies';
            const method = companyId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(companyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Firma kaydedilirken bir hata oluştu');
            }

            location.reload();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    });

    // Edit Company
    document.querySelectorAll('.edit-company').forEach(button => {
        button.addEventListener('click', async (e) => {
            try {
                const companyId = e.currentTarget.dataset.id;
                if (!companyId) {
                    throw new Error('Firma ID bulunamadı');
                }

                const response = await fetch(`/api/companies/${companyId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Firma bilgileri alınamadı');
                }

                const company = await response.json();
                
                const idInput = document.getElementById('companyId');
                const nameInput = document.getElementById('companyName');
                const emailInput = document.getElementById('companyEmail');

                if (!idInput || !nameInput || !emailInput) {
                    throw new Error('Form alanları bulunamadı');
                }

                idInput.value = company.id;
                nameInput.value = company.name;
                emailInput.value = company.contact_email;

                companyModal.show();
            } catch (error) {
                alert('Hata: ' + error.message);
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

                const companyId = e.currentTarget.dataset.id;
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
                alert('Hata: ' + error.message);
            }
        });
    });
});
