document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize Bootstrap components
        const companyModalElement = document.getElementById('companyModal');
        if (!companyModalElement) {
            throw new Error('Firma modal elementi bulunamadı');
        }
        const companyModal = new bootstrap.Modal(companyModalElement);

        // Validate form elements
        const companyForm = document.getElementById('companyForm');
        if (!companyForm) {
            throw new Error('Firma formu bulunamadı');
        }

        const saveButton = document.getElementById('saveCompany');
        if (!saveButton) {
            throw new Error('Kaydet butonu bulunamadı');
        }

        // Add Company
        saveButton.addEventListener('click', async () => {
            try {
                const nameInput = document.getElementById('companyName');
                const emailInput = document.getElementById('companyEmail');
                
                if (!nameInput || !emailInput) {
                    throw new Error('Form alanları bulunamadı');
                }

                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                
                if (!name) {
                    throw new Error('Firma adı boş olamaz');
                }
                if (!email) {
                    throw new Error('E-posta adresi boş olamaz');
                }
                if (!email.includes('@')) {
                    throw new Error('Geçerli bir e-posta adresi giriniz');
                }

                const companyId = document.getElementById('companyId')?.value;
                const url = companyId ? `/api/companies/${companyId}` : '/api/companies';
                const method = companyId ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        contact_email: email
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Firma kaydedilirken bir hata oluştu');
                }

                // Success message and reload
                alert(data.message || 'İşlem başarılı');
                location.reload();
            } catch (error) {
                alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
            }
        });

        // Edit Company
        const editButtons = document.querySelectorAll('.edit-company');
        editButtons.forEach(button => {
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
                    alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
                }
            });
        });

        // Delete Company
        const deleteButtons = document.querySelectorAll('.delete-company');
        deleteButtons.forEach(button => {
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
                    alert('Hata: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
                }
            });
        });

    } catch (error) {
        alert('Sayfa yüklenirken hata oluştu: ' + (error.message || 'Bilinmeyen bir hata oluştu'));
    }
});
