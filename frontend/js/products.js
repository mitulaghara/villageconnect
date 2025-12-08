// Products page functionality

// State variables - Global
let currentPage = 1;
let loading = false;
let hasMore = true;
let currentCategory = '';
let currentVillage = '';
let currentSearch = '';
let currentSort = 'newest';
let searchTimer = null;
let savedProductIds = []; // Track saved products

document.addEventListener('DOMContentLoaded', function () {
    console.log('Starting products page initialization');

    // Initialize products page
    initProductsPage();

    // Event listeners for filters
    const categoryFilter = document.getElementById('categoryFilter');
    const villageFilter = document.getElementById('villageFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            currentCategory = this.value;
            reloadProducts();
            updateActiveFilters();
        });
    }

    if (villageFilter) {
        villageFilter.addEventListener('change', function () {
            currentVillage = this.value;
            reloadProducts();
            updateActiveFilters();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', function () {
            currentSort = this.value;
            reloadProducts();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentSearch = this.value;
            // Debounce search
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                reloadProducts();
                updateActiveFilters();
            }, 500);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', reloadProducts);
    }

    // Load villages for filter
    loadVillages();
});

async function initProductsPage() {
    // Get category from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        currentCategory = category;
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = category;
        }
    }

    await loadSavedProducts();
    await loadProducts();
    updateActiveFilters();
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

async function toggleSaveProduct(productId, btnElement) {
    console.log('toggleSaveProduct called for:', productId);
    if (!currentUser) {
        showNotification('Please login to save products', 'error');
        return;
    }

    const isSaved = savedProductIds.includes(productId);
    const method = isSaved ? 'DELETE' : 'POST';
    const action = isSaved ? 'unsave' : 'save';

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/save`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            savedProductIds = data.savedProducts;

            // Update UI
            if (isSaved) {
                btnElement.innerHTML = '<i class="far fa-heart"></i>';
                btnElement.classList.remove('saved');
                showNotification('Product removed from saved items', 'info');
            } else {
                btnElement.innerHTML = '<i class="fas fa-heart"></i>';
                btnElement.classList.add('saved');
                showNotification('Product saved!', 'success');
            }
        }
    } catch (error) {
        console.error(`Error ${action} product:`, error);
        showNotification('Action failed. Please try again.', 'error');
    }
}

async function loadProducts(page = 1, append = false) {
    console.log('loadProducts called', { page, append, loading });
    if (loading) return;

    loading = true;

    const productsGrid = document.getElementById('productsGrid');
    const loadingEl = document.getElementById('loading');
    const noProductsEl = document.getElementById('noProducts');
    const loadMoreEl = document.getElementById('loadMore');

    if (!append) {
        if (productsGrid) productsGrid.innerHTML = '';
        currentPage = 1;
    }

    if (loadingEl) loadingEl.style.display = 'block';
    if (noProductsEl) noProductsEl.style.display = 'none';
    if (loadMoreEl) loadMoreEl.style.display = 'none';

    // Safety timeout to clear loading state
    const safetyTimeout = setTimeout(() => {
        if (loading) {
            console.warn('loadProducts timed out');
            loading = false;
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }, 10000);

    try {
        let url = `${API_BASE_URL}/products?page=${page}&limit=12`;

        if (currentCategory) url += `&category=${currentCategory}`;
        if (currentVillage) url += `&village=${currentVillage}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

        console.log('Fetching products from:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('Products data received:', data);

        if (response.ok && data.products) {
            // Sort products if needed
            let products = data.products;
            if (currentSort === 'price_low') {
                products.sort((a, b) => a.price - b.price);
            } else if (currentSort === 'price_high') {
                products.sort((a, b) => b.price - a.price);
            }

            if (products.length === 0 && page === 1) {
                if (noProductsEl) noProductsEl.style.display = 'block';
                if (loadMoreEl) loadMoreEl.style.display = 'none';
            } else {
                if (productsGrid) {
                    productsGrid.style.display = 'grid'; // Ensure it is visible
                    displayProducts(products, productsGrid, append);
                }


                // Check if there are more products
                hasMore = data.products.length === 12;
                if (loadMoreEl) {
                    loadMoreEl.style.display = hasMore ? 'block' : 'none';
                }
            }
        } else {
            console.error('Failed to load products: data is missing products array', data);
            showNotification('Failed to load products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        clearTimeout(safetyTimeout);
        loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

function displayProducts(products, container, append = false) {
    if (!append) {
        container.innerHTML = '';
    }

    products.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';

    let imageUrl = 'https://cdn.pixabay.com/photo/2015/12/09/16/32/farm-1084989_640.jpg';

    if (product.images && product.images.length > 0) {
        const imagePath = product.images[0];
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            imageUrl = imagePath;
        } else {
            imageUrl = `${BACKEND_URL}/uploads/${imagePath}`;
        }
    }

    const isSaved = savedProductIds.includes(product._id);
    const heartIconClass = isSaved ? 'fas' : 'far';
    const savedClass = isSaved ? 'saved' : '';

    div.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.title}" loading="lazy">
            <span class="product-category">${getCategoryName(product.category)}</span>
            <button class="save-btn ${savedClass}" onclick="event.stopPropagation(); toggleSaveProduct('${product._id}', this)" style="position:absolute; top:10px; right:10px; background:white; border:none; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2); color:${isSaved ? '#e91e63' : '#666'}; font-size:1.2rem; transition:all 0.3s ease; z-index:10;">
                <i class="${heartIconClass} fa-heart"></i>
            </button>
        </div>
        <div class="product-info">
            <h3>${product.title}</h3>
            <p class="price">₹${product.price}</p>
            <div class="product-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${product.userVillage || 'Village'}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(product.createdAt)}</span>
            </div>
            <a href="product-detail.html?id=${product._id}" class="btn btn-primary btn-block">View Details</a>
        </div>
    `;

    return div;
}

function loadMoreProducts() {
    if (!loading && hasMore) {
        currentPage++;
        loadProducts(currentPage, true);
    }
}

function reloadProducts() {
    currentPage = 1;
    loadProducts();
}

async function loadVillages() {
    try {
        const response = await fetch(`${API_BASE_URL}/villages`);
        if (response.ok) {
            const villages = await response.json();
            const villageFilter = document.getElementById('villageFilter');

            if (villageFilter && villages.length > 0) {
                villages.forEach(village => {
                    const option = document.createElement('option');
                    option.value = village;
                    option.textContent = village;
                    villageFilter.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading villages:', error);
    }
}

function updateActiveFilters() {
    const activeFilters = document.getElementById('activeFilters');
    if (!activeFilters) return;

    activeFilters.innerHTML = '';

    const filters = [];

    if (currentCategory) {
        filters.push({
            name: 'Category',
            value: getCategoryName(currentCategory),
            type: 'category'
        });
    }

    if (currentVillage) {
        filters.push({
            name: 'Village',
            value: currentVillage,
            type: 'village'
        });
    }

    if (currentSearch) {
        filters.push({
            name: 'Search',
            value: currentSearch,
            type: 'search'
        });
    }

    filters.forEach(filter => {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            <span>${filter.name}: ${filter.value}</span>
            <button onclick="removeFilter('${filter.type}')"><i class="fas fa-times"></i></button>
        `;
        activeFilters.appendChild(tag);
    });
}

function removeFilter(type) {
    switch (type) {
        case 'category':
            currentCategory = '';
            document.getElementById('categoryFilter').value = '';
            break;
        case 'village':
            currentVillage = '';
            document.getElementById('villageFilter').value = '';
            break;
        case 'search':
            currentSearch = '';
            document.getElementById('searchInput').value = '';
            break;
    }

    reloadProducts();
    updateActiveFilters();
}

// Make functions available globally
window.loadMoreProducts = loadMoreProducts;
window.removeFilter = removeFilter;
window.toggleSaveProduct = toggleSaveProduct;