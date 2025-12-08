// Product detail page functionality
let savedProductIds = [];

document.addEventListener('DOMContentLoaded', function () {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showNotification('Product not found', 'error');
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 2000);
        return;
    }

    initProductDetail(productId);
});

async function initProductDetail(productId) {
    try {
        // Load product details
        const product = await loadProductDetails(productId);

        if (product) {
            displayProductDetails(product);

            if (currentUser) {
                await loadSavedProducts();
                updateSaveButtonState(product._id);
            }

            loadSimilarProducts(product.category, productId);

            // Setup event listeners
            setupProductDetailEvents(product);
        } else {
            showNotification('Failed to load product', 'error');
            setTimeout(() => {
                window.location.href = 'products.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading product details:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}


async function loadSavedProducts() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/user/saved-products`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        if (response.ok) {
            const savedProducts = await response.json();
            savedProductIds = savedProducts.map(p => p._id);
        }
    } catch (error) {
        console.error('Error loading saved products:', error);
    }
}

function updateSaveButtonState(productId) {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;

    if (savedProductIds.includes(productId)) {
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        saveBtn.classList.remove('btn-outline');
        saveBtn.classList.add('btn-primary');
    } else {
        saveBtn.innerHTML = '<i class="far fa-bookmark"></i> Save';
        saveBtn.classList.add('btn-outline');
        saveBtn.classList.remove('btn-primary');
    }
}

async function loadProductDetails(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);

        if (response.ok) {
            return await response.json();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

function displayProductDetails(product) {
    // Update page title
    document.title = `${product.title} - VillageConnect`;

    // Update product information
    document.getElementById('productTitle').textContent = product.title;
    document.getElementById('productCategory').textContent = getCategoryName(product.category);
    document.getElementById('productPrice').textContent = `₹${product.price}`;
    document.getElementById('productDescription').textContent = product.description;

    // Update status
    document.getElementById('productStatus').textContent = product.status === 'active' ? 'Available' : product.status;

    // Update seller information
    document.getElementById('sellerName').textContent = product.userName;
    document.getElementById('sellerLocation').textContent = product.userVillage;
    document.getElementById('sellerFullName').textContent = product.userName;
    document.getElementById('sellerVillage').textContent = product.userVillage;
    document.getElementById('contactNumber').textContent = product.contact;

    // Update seller avatar
    const sellerAvatar = document.getElementById('sellerAvatar');
    if (sellerAvatar) {
        sellerAvatar.textContent = product.userName.charAt(0).toUpperCase();
    }

    // Update dates
    document.getElementById('postedDate').textContent = formatDate(product.createdAt);
    document.getElementById('productDate').textContent = formatDate(product.createdAt);

    // Update member since (approximate)
    const memberSince = document.getElementById('memberSince');
    if (memberSince) {
        const memberDate = new Date(product.createdAt);
        memberSince.textContent = memberDate.getFullYear();
    }

    // Update contact buttons
    const callLink = document.getElementById('callLink');
    const whatsappLink = document.getElementById('whatsappLink');

    if (callLink) {
        callLink.href = `tel:${product.contact}`;
    }

    if (whatsappLink) {
        whatsappLink.addEventListener('click', () => {
            const message = `Hi, I'm interested in your product "${product.title}" (₹${product.price}) on VillageConnect.`;
            const whatsappUrl = `https://wa.me/${product.contact.replace('+', '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // Display images
    displayProductImages(product.images);

    // Show report button for logged in users (except owner)
    const reportSection = document.getElementById('reportSection');
    if (reportSection && currentUser && currentUser.id !== product.userId) {
        reportSection.style.display = 'block';
    }
}

function displayProductImages(images) {
    const mainImage = document.getElementById('mainImage');
    const thumbnailImages = document.getElementById('thumbnailImages');

    if (!images || images.length === 0) {
        if (mainImage) {
            mainImage.innerHTML = `
                <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>No image available</p>
                </div>
            `;
        }
        if (thumbnailImages) thumbnailImages.innerHTML = '';
        return;
    }

    // Set main image
    if (mainImage) {
        mainImage.innerHTML = `<img src="${BACKEND_URL}/uploads/${images[0]}" alt="Main image" id="currentMainImage">`;
    }

    // Create thumbnails
    if (thumbnailImages) {
        thumbnailImages.innerHTML = '';

        images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${BACKEND_URL}/uploads/${image}" alt="Image ${index + 1}">`;

            thumbnail.addEventListener('click', () => {
                // Update main image
                const mainImg = document.getElementById('currentMainImage');
                if (mainImg) {
                    mainImg.src = `${BACKEND_URL}/uploads/${image}`;
                }

                // Update active thumbnail
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });

            thumbnailImages.appendChild(thumbnail);
        });
    }
}

async function loadSimilarProducts(category, excludeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products?category=${category}&limit=4`);

        if (response.ok) {
            const data = await response.json();
            const similarProducts = data.products.filter(p => p._id !== excludeId).slice(0, 3);

            if (similarProducts.length > 0) {
                displaySimilarProducts(similarProducts);
            } else {
                const container = document.getElementById('similarProducts');
                if (container) {
                    container.innerHTML = `
                        <div class="no-products" style="grid-column: 1 / -1;">
                            <i class="fas fa-box-open"></i>
                            <p>No similar products found</p>
                        </div>
                    `;
                }
            }
        }
    } catch (error) {
        console.error('Error loading similar products:', error);
        const container = document.getElementById('similarProducts');
        if (container) {
            container.innerHTML = '';
        }
    }
}

function displaySimilarProducts(products) {
    const container = document.getElementById('similarProducts');
    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
        const productCard = createSimilarProductCard(product);
        container.appendChild(productCard);
    });
}

function createSimilarProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';

    const imageUrl = product.images && product.images.length > 0
        ? `${BACKEND_URL}/uploads/${product.images[0]}`
        : 'https://images.unsplash.com/photo-1586773860418-dc22f8b874bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

    div.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.title}" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.title}</h3>
            <p class="product-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>
            <div class="product-price">₹${product.price}</div>
            <div class="product-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${product.userVillage}</span>
            </div>
            <a href="product-detail.html?id=${product._id}" class="btn btn-outline btn-block mt-2">View Details</a>
        </div>
    `;

    return div;
}

function setupProductDetailEvents(product) {
    // Contact button
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to contact seller', 'error');
                showModal('loginModal');
                return;
            }

            // Scroll to seller info
            document.querySelector('.seller-info').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // WhatsApp button
    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to contact seller', 'error');
                showModal('loginModal');
                return;
            }

            const message = `Hi, I'm interested in your product "${product.title}" (₹${product.price}) on VillageConnect.`;
            const whatsappUrl = `https://wa.me/${product.contact.replace('+', '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }

    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentUser) {
                showNotification('Please login to save products', 'error');
                showModal('loginModal');
                return;
            }

            const isSaved = savedProductIds.includes(product._id);
            const method = isSaved ? 'DELETE' : 'POST';

            // Optimistic UI update
            if (isSaved) {
                savedProductIds = savedProductIds.filter(id => id !== product._id);
            } else {
                savedProductIds.push(product._id);
            }
            updateSaveButtonState(product._id);

            try {
                const response = await fetch(`${API_BASE_URL}/products/${product._id}/save`, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${currentUser.token}`
                    }
                });

                if (response.ok) {
                    showNotification(isSaved ? 'Product removed from saved items' : 'Product saved successfully', 'success');
                } else {
                    // Revert UI on error
                    if (isSaved) savedProductIds.push(product._id);
                    else savedProductIds = savedProductIds.filter(id => id !== product._id);
                    updateSaveButtonState(product._id);
                    showNotification('Failed to update saved status', 'error');
                }
            } catch (error) {
                console.error('Error saving product:', error);
                // Revert UI on error
                if (isSaved) savedProductIds.push(product._id);
                else savedProductIds = savedProductIds.filter(id => id !== product._id);
                updateSaveButtonState(product._id);
                showNotification('Network error', 'error');
            }
        });
    }

    // Share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareUrl = window.location.href;
            const shareText = `${product.title} - ₹${product.price} | VillageConnect`;

            if (navigator.share) {
                navigator.share({
                    title: product.title,
                    text: shareText,
                    url: shareUrl
                });
            } else {
                // Fallback: Copy to clipboard
                navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
                    .then(() => showNotification('Link copied to clipboard', 'success'))
                    .catch(() => showNotification('Failed to share', 'error'));
            }
        });
    }

    // Report button
    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            if (!currentUser) {
                showNotification('Please login to report products', 'error');
                showModal('loginModal');
                return;
            }

            showModal('reportModal');

            // Setup report form
            const reportForm = document.getElementById('reportForm');
            if (reportForm) {
                reportForm.onsubmit = (e) => {
                    e.preventDefault();

                    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
                    const details = document.getElementById('reportDetails').value;

                    if (!reason) {
                        showNotification('Please select a reason', 'error');
                        return;
                    }

                    // TODO: Send report to server
                    console.log('Report submitted:', {
                        productId: product._id,
                        reason,
                        details,
                        reportedBy: currentUser.id
                    });

                    hideModal(document.getElementById('reportModal'));
                    showModal('successModal');
                };
            }
        });
    }
}