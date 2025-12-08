// Post product page functionality
let currentStep = 1;
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Please login to post a product', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    initPostProductPage();
});

function initPostProductPage() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('productImages');
    const postForm = document.getElementById('postProductForm');
    const submitBtn = document.getElementById('submitBtn');
    const nextStepBtns = document.querySelectorAll('.next-step');
    const prevStepBtns = document.querySelectorAll('.prev-step');

    currentStep = 1;
    selectedFiles = [];

    // Upload area click event
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    // File input change event
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Drag and drop events
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');

            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect();
            }
        });
    }

    // Form step navigation
    if (nextStepBtns) {
        nextStepBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const nextStep = this.getAttribute('data-next');
                goToStep(nextStep);
            });
        });
    }

    if (prevStepBtns) {
        prevStepBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const prevStep = this.getAttribute('data-prev');
                goToStep(prevStep);
            });
        });
    }

    // Form submit event
    if (postForm) {
        postForm.addEventListener('submit', handlePostProduct);
    }

    // Initialize contact field with user's phone
    const contactField = document.getElementById('productContact');
    if (contactField && currentUser && currentUser.phone) {
        contactField.value = currentUser.phone;
    }

    // Update review section when form changes
    const formInputs = postForm.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('input', updateReview);
        input.addEventListener('change', updateReview);
    });

    // Trigger initial review update
    updateReview();
}

function goToStep(step) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
        return;
    }

    // Hide current step
    const currentStepEl = document.getElementById(`step${currentStep}`);
    const currentStepBtn = document.querySelector(`.step[data-step="${currentStep}"]`);

    if (currentStepEl) currentStepEl.classList.remove('active');
    if (currentStepBtn) currentStepBtn.classList.remove('active');

    // Show new step
    const newStepEl = document.getElementById(`step${step}`);
    const newStepBtn = document.querySelector(`.step[data-step="${step}"]`);

    if (newStepEl) newStepEl.classList.add('active');
    if (newStepBtn) newStepBtn.classList.add('active');

    currentStep = parseInt(step);

    // Scroll to top of form
    window.scrollTo({
        top: document.querySelector('.form-container').offsetTop - 100,
        behavior: 'smooth'
    });
}

function validateStep(step) {
    switch (step) {
        case 1:
            const title = document.getElementById('productTitle').value.trim();
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value.trim();

            if (!title) {
                showNotification('Please enter a product title', 'error');
                return false;
            }

            if (!category) {
                showNotification('Please select a category', 'error');
                return false;
            }

            if (!description) {
                showNotification('Please enter a description', 'error');
                return false;
            }

            return true;

        case 2:
            const price = document.getElementById('productPrice').value;

            if (!price || parseFloat(price) <= 0) {
                showNotification('Please enter a valid price', 'error');
                return false;
            }

            return true;

        default:
            return true;
    }
}

function handleFileSelect() {
    const fileInput = document.getElementById('productImages');
    const files = Array.from(fileInput.files);

    // Validate files
    const validFiles = files.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

        if (!isValidType) {
            showNotification(`${file.name}: Only JPG, PNG, GIF, WEBP files are allowed`, 'error');
            return false;
        }

        if (!isValidSize) {
            showNotification(`${file.name}: File size must be less than 5MB`, 'error');
            return false;
        }

        return true;
    });

    // Limit to 5 files
    if (selectedFiles.length + validFiles.length > 5) {
        showNotification('You can upload maximum 5 images', 'error');
        validFiles.splice(5 - selectedFiles.length);
    }

    // Add to selected files
    selectedFiles.push(...validFiles);

    // Update image preview
    updateImagePreview();
    updateReview();
}

function updateImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;

    imagePreview.innerHTML = '';

    if (selectedFiles.length === 0) {
        return;
    }

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';

            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="removeImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;

            imagePreview.appendChild(previewItem);
        };

        reader.readAsDataURL(file);
    });
}

function removeImage(index) {
    selectedFiles.splice(index, 1);
    updateImagePreview();
    updateReview();
}

function updateReview() {
    // Update review section with current form data
    const reviewTitle = document.getElementById('reviewTitle');
    const reviewCategory = document.getElementById('reviewCategory');
    const reviewPrice = document.getElementById('reviewPrice');
    const reviewPhotos = document.getElementById('reviewPhotos');

    if (reviewTitle) {
        const title = document.getElementById('productTitle').value.trim();
        reviewTitle.textContent = title || '-';
    }

    if (reviewCategory) {
        const category = document.getElementById('productCategory').value;
        reviewCategory.textContent = category ? getCategoryName(category) : '-';
    }

    if (reviewPrice) {
        const price = document.getElementById('productPrice').value;
        reviewPrice.textContent = price || '-';
    }

    if (reviewPhotos) {
        reviewPhotos.textContent = selectedFiles.length;
    }
}

async function handlePostProduct(e) {
    e.preventDefault();

    if (!currentUser) {
        showNotification('Please login first', 'error');
        return;
    }

    // Validate all steps
    if (!validateStep(1) || !validateStep(2)) {
        goToStep(1);
        return;
    }

    const contact = document.getElementById('productContact').value.trim();
    if (!contact) {
        showNotification('Please enter a contact number', 'error');
        goToStep(3);
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting Product...';

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', document.getElementById('productTitle').value.trim());
        formData.append('category', document.getElementById('productCategory').value);
        formData.append('price', document.getElementById('productPrice').value);
        formData.append('description', document.getElementById('productDescription').value.trim());
        formData.append('contact', contact);

        // Append images
        selectedFiles.forEach((file, index) => {
            formData.append('images', file);
        });

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Show success modal
            showModal('successModal');

            // Reset form
            document.getElementById('postProductForm').reset();
            selectedFiles = [];
            updateImagePreview();
            updateReview();
            goToStep(1);
        } else {
            console.error('Post product error:', data);

            // Handle invalid token / authentication error
            if (response.status === 401 || data.error === 'Invalid token' || data.error === 'Authentication required') {
                showNotification('Session expired. Please login again.', 'error');

                // Clear invalid user data
                localStorage.removeItem('currentUser');
                currentUser = null;

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            showNotification(data.error || 'Failed to post product', 'error');
        }
    } catch (error) {
        console.error('Error posting product:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Make functions available globally
window.removeImage = removeImage;