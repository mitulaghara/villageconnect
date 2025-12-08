// Dashboard page functionality
if (typeof API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'http://localhost:5001/api';
}

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    if (!currentUser) {
        showNotification('Please login to view dashboard', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    initDashboard();
});

async function initDashboard() {
    console.log('Initializing dashboard...');

    // Setup tab functionality and event listeners immediately
    setupTabs();
    setupDashboardEvents();

    // Load user profile
    await loadUserProfile();

    // Load user's products
    await loadMyProducts();

    // Load saved products
    await loadSavedProducts();

    // Load notifications
    await loadDashboardNotifications();

    // Load admin data if user is admin
    if (currentUser && currentUser.role === 'admin') {
        await loadAdminData();
    }
}

async function loadSavedProducts() {
    console.log('loadSavedProducts started');
    try {
        const response = await fetch(`${API_BASE_URL}/user/saved-products`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}` // Changed 'token' back to 'currentUser.token' for functionality
            }
        });

        if (response.ok) {
            const savedProducts = await response.json(); // Renamed 'products' to 'savedProducts'
            console.log('Saved products data:', savedProducts);

            const savedProductsList = document.getElementById('savedProductsList');
            const noSaved = document.getElementById('noSaved');

            if (savedProducts.length === 0) { // Changed 'products.length' to 'savedProducts.length'
                if (noSaved) noSaved.style.display = 'block';
                if (savedProductsList) savedProductsList.style.display = 'none';
                return;
            }

            if (noSaved) noSaved.style.display = 'none';
            if (savedProductsList) {
                savedProductsList.style.display = 'grid';
                savedProductsList.innerHTML = '';

                savedProducts.forEach(product => {
                    const card = createSavedProductCard(product);
                    savedProductsList.appendChild(card);
                });
            }
        } else {
            console.error('Failed to load saved products');
        }
    } catch (error) {
        console.error('Error loading saved products:', error);
    }
}

function createSavedProductCard(product) {
    const div = document.createElement('div');
    div.className = 'dashboard-product-card';

    let imageUrl = 'https://cdn.pixabay.com/photo/2015/12/09/16/32/farm-1084989_640.jpg';
    if (product.images && product.images.length > 0) {
        const imagePath = product.images[0];
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            imageUrl = imagePath;
        } else {
            imageUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${imagePath}`;
        }
    }

    div.innerHTML = `
        <div class="dashboard-product-image" style="position:relative;">
            <img src="${imageUrl}" alt="${product.title}" style="width:100%; height:150px; object-fit:cover; border-radius:4px; margin-bottom:10px;">
        </div>
        <h4>${product.title}</h4>
        <p><strong>Price:</strong> ₹${product.price}</p>
        <p><strong>Village:</strong> ${product.userVillage || 'N/A'}</p>
        <div class="product-actions">
            <a href="product-detail.html?id=${product._id}" class="btn btn-primary">View</a>
            <button class="btn btn-outline" style="border-color:red; color:red;" onclick="removeSavedProduct('${product._id}')">Remove</button>
        </div>
    `;
    return div;
}

async function removeSavedProduct(productId) {
    if (!confirm('Remove this product from saved items?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/save`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        if (response.ok) {
            showNotification('Product removed from saved items', 'success');
            loadSavedProducts(); // Refresh list
        } else {
            showNotification('Failed to remove product', 'error');
        }
    } catch (error) {
        console.error('Error removing saved product:', error);
    }
}

// Expose to window
window.removeSavedProduct = removeSavedProduct;

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            // Update dashboard header
            document.getElementById('userName').textContent = user.name;
            // document.getElementById('userEmail').textContent = user.email; // Element doesn't exist in sidebar
            document.getElementById('userVillage').textContent = user.village;
            document.getElementById('userRole').textContent = user.role === 'admin' ? 'Admin' : 'Member';

            // Update user avatar
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.textContent = user.name.charAt(0).toUpperCase();
            }

            // Update account form
            document.getElementById('accountName').value = user.name;
            document.getElementById('accountEmail').value = user.email;
            document.getElementById('accountPhone').value = user.phone;
            document.getElementById('accountVillage').value = user.village;

        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadMyProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/user/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const myProductsList = document.getElementById('myProductsList');
            const noProducts = document.getElementById('noProducts');
            const productsCount = document.getElementById('productsCount');

            // Update product count
            if (productsCount) {
                productsCount.textContent = products.length;
            }

            if (products.length === 0) {
                if (noProducts) noProducts.style.display = 'block';
                if (myProductsList) myProductsList.style.display = 'none';
                return;
            }

            if (noProducts) noProducts.style.display = 'none';
            if (myProductsList) {
                myProductsList.innerHTML = '';

                products.forEach(product => {
                    const productCard = createDashboardProductCard(product);
                    myProductsList.appendChild(productCard);
                });
            }
        }
    } catch (error) {
        console.error('Error loading my products:', error);
        showNotification('Failed to load products', 'error');
    }
}

function createDashboardProductCard(product) {
    const div = document.createElement('div');
    div.className = 'dashboard-product-card';
    div.id = `product-${product._id}`;

    const statusClass = product.status === 'active' ? 'status-active' :
        product.status === 'sold' ? 'status-sold' : 'status-expired';

    let imageUrl = 'https://cdn.pixabay.com/photo/2015/12/09/16/32/farm-1084989_640.jpg';
    if (product.images && product.images.length > 0) {
        const imagePath = product.images[0];
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            imageUrl = imagePath;
        } else {
            imageUrl = `${API_BASE_URL.replace('/api', '')}/uploads/${imagePath}`;
        }
    }

    div.innerHTML = `
        <div class="dashboard-product-image">
            <img src="${imageUrl}" alt="${product.title}" style="width:100%; height:150px; object-fit:cover; border-radius:4px; margin-bottom:10px;">
        </div>
        <h4>${product.title}</h4>
        <p><strong>Category:</strong> ${getCategoryName(product.category)}</p>
        <p><strong>Price:</strong> ₹${product.price}</p>
        <p><strong>Status:</strong> <span class="${statusClass}">${product.status}</span></p>
        <p><strong>Posted:</strong> ${formatDate(product.createdAt)}</p>
        <div class="product-actions">
            <a href="product-detail.html?id=${product._id}" class="btn btn-primary">View</a>
            <button class="btn btn-outline" onclick="editProduct('${product._id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product._id}')">Delete</button>
        </div>
    `;

    return div;
}

async function loadDashboardNotifications() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            const notifications = await response.json();
            const dashboardNotifications = document.getElementById('dashboardNotifications');
            const noNotifications = document.getElementById('noNotifications');

            if (notifications.length === 0) {
                if (noNotifications) noNotifications.style.display = 'block';
                if (dashboardNotifications) dashboardNotifications.style.display = 'none';
                return;
            }

            if (noNotifications) noNotifications.style.display = 'none';
            if (dashboardNotifications) {
                dashboardNotifications.innerHTML = '';

                notifications.slice(0, 20).forEach(notification => {
                    const item = document.createElement('div');
                    item.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
                    item.innerHTML = `
                        <p>${notification.message}</p>
                        <small>${formatDate(notification.createdAt)}</small>
                    `;

                    if (notification.productId) {
                        item.style.cursor = 'pointer';
                        item.addEventListener('click', () => {
                            window.location.href = `product-detail.html?id=${notification.productId}`;
                        });
                    }

                    dashboardNotifications.appendChild(item);
                });
            }
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function loadAdminData() {
    try {
        // Load admin stats
        const statsResponse = await fetch(`${API_BASE_URL}/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            document.getElementById('adminTotalUsers').textContent = stats.totalUsers;
            document.getElementById('adminTotalProducts').textContent = stats.totalProducts;
        }

        // Load all users
        const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (usersResponse.ok) {
            const users = await usersResponse.json();
            const adminUsersTable = document.getElementById('adminUsersTable');

            if (adminUsersTable) {
                adminUsersTable.innerHTML = '';

                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <strong>${user.name}</strong><br>
                            <small>${user.email}</small>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.village}</td>
                        <td>
                            <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                                ${user.role}
                            </span>
                        </td>
                        <td>${formatDate(user.createdAt)}</td>
                        <td class="actions">
                            <button class="btn btn-sm btn-outline" onclick="adminViewUser('${user._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${user._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    adminUsersTable.appendChild(row);
                });
            }
        }

        // Load all products
        const productsResponse = await fetch(`${API_BASE_URL}/admin/products`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (productsResponse.ok) {
            const products = await productsResponse.json();
            const adminProductsTable = document.getElementById('adminProductsTable');

            if (adminProductsTable) {
                adminProductsTable.innerHTML = '';

                products.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <strong>${product.title}</strong><br>
                            <small>${product.description.substring(0, 50)}...</small>
                        </td>
                        <td>${product.userName}</td>
                        <td>₹${product.price}</td>
                        <td>${getCategoryName(product.category)}</td>
                        <td>${formatDate(product.createdAt)}</td>
                        <td>
                            <span class="badge badge-${product.status}">
                                ${product.status}
                            </span>
                        </td>
                        <td class="actions">
                            <a href="product-detail.html?id=${product._id}" class="btn btn-sm btn-outline">
                                <i class="fas fa-eye"></i>
                            </a>
                            <button class="btn btn-sm btn-danger" onclick="adminDeleteProduct('${product._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    adminProductsTable.appendChild(row);
                });
            }
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });

            // Handle admin tabs
            if (tabId === 'admin') {
                setupAdminTabs();
            }
        });
    });

    // Admin tabs
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminTabContents = document.querySelectorAll('.admin-tab-content');

    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-admin-tab');

            // Update active admin tab button
            adminTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show active admin tab content
            adminTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `admin-${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function setupDashboardEvents() {
    // Account settings form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }

    // Delete account button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            showModal('deleteAccountModal');

            // Enable delete button when user types "DELETE"
            const deleteConfirm = document.getElementById('deleteConfirm');
            const confirmAccountDeleteBtn = document.getElementById('confirmAccountDeleteBtn');

            if (deleteConfirm && confirmAccountDeleteBtn) {
                deleteConfirm.addEventListener('input', function () {
                    confirmAccountDeleteBtn.disabled = this.value !== 'DELETE';
                });

                confirmAccountDeleteBtn.addEventListener('click', handleDeleteAccount);
            }
        });
    }

    // Mark all notifications as read
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    }

    // Logout from all devices
    const logoutAllBtn = document.getElementById('logoutAllBtn');
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', handleLogoutAll);
    }

    // Admin search
    const adminSearchBtn = document.getElementById('adminSearchBtn');
    if (adminSearchBtn) {
        adminSearchBtn.addEventListener('click', handleAdminSearch);
    }

    // Edit Product Form
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleUpdateProduct);
    }
}

async function handleAccountUpdate(e) {
    e.preventDefault();
    console.log('handleAccountUpdate called');

    const name = document.getElementById('accountName').value;
    const phone = document.getElementById('accountPhone').value;
    const village = document.getElementById('accountVillage').value;
    // const currentPassword = document.getElementById('currentPassword').value;
    // const newPassword = document.getElementById('newPassword').value;
    // const confirmPassword = document.getElementById('confirmPassword').value;

    const updateData = { name, phone, village };
    console.log('Updating profile with:', updateData);

    try {
        // Update profile
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            console.log('Profile updated successfully');
            showNotification('Profile updated successfully', 'success');

            // Update local user data
            const data = await response.json();
            currentUser = { ...currentUser, ...data.user };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Update UI
            updateUserInfo();
        } else {
            const error = await response.json();
            console.error('Failed to update profile:', error);
            showNotification('Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleDeleteAccount() {
    const confirmBtn = document.getElementById('confirmAccountDeleteBtn');
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        confirmBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showNotification('Account deleted successfully. Goodbye!', 'success');

            // Clear local storage
            localStorage.removeItem('currentUser');
            currentUser = null;

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showNotification('Failed to delete account', 'error');
            if (confirmBtn) {
                confirmBtn.innerHTML = 'Delete My Account';
            }
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Network error', 'error');
        if (confirmBtn) {
            confirmBtn.innerHTML = 'Delete My Account';
        }
    }
}

function updateUserInfo() {
    // Update dashboard header
    document.getElementById('userName').textContent = currentUser.name;
    // document.getElementById('userEmail').textContent = currentUser.email; 
    document.getElementById('userVillage').textContent = currentUser.village;
}

async function markAllNotificationsRead() {
    // TODO: Implement mark all as read API
    showNotification('All notifications marked as read', 'success');

    // Update UI
    const notifications = document.querySelectorAll('.notification-item.unread');
    notifications.forEach(notification => {
        notification.classList.remove('unread');
    });

    const countElement = document.querySelector('.notification-count');
    if (countElement) {
        countElement.style.display = 'none';
    }
}

async function handleLogoutAll() {
    if (confirm('Are you sure you want to logout from all devices?')) {
        // TODO: Implement logout all API
        showNotification('Logged out from all devices', 'success');

        // Clear local storage and redirect
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

async function handleAdminSearch() {
    const searchTerm = document.getElementById('adminSearch').value;
    // TODO: Implement admin search functionality
    showNotification(`Searching for "${searchTerm}"...`, 'info');
}

// Product management functions
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            // Remove product from DOM
            const productElement = document.getElementById(`product-${productId}`);
            if (productElement) {
                productElement.remove();
            }

            showNotification('Product deleted successfully', 'success');
            loadMyProducts(); // Refresh list
        } else {
            showNotification('Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}


// Open Edit Product Modal
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (response.ok) {
            const product = await response.json();

            // Populate form
            document.getElementById('editProductId').value = product._id;
            document.getElementById('editTitle').value = product.title;
            document.getElementById('editCategory').value = product.category;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editContact').value = product.contact;
            document.getElementById('editDescription').value = product.description;

            // Add status field if it doesn't exist in the modal HTML, typically for update we might want it
            if (document.getElementById('editStatus')) {
                document.getElementById('editStatus').value = product.status || 'active';
            }

            showModal('editProductModal');
        } else {
            showNotification('Failed to load product details', 'error');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        showNotification('Network error', 'error');
    }
}

async function handleUpdateProduct(e) {
    e.preventDefault();
    console.log('handleUpdateProduct called');

    const productId = document.getElementById('editProductId').value;
    const title = document.getElementById('editTitle').value;
    const category = document.getElementById('editCategory').value;
    const price = document.getElementById('editPrice').value;
    const contact = document.getElementById('editContact').value;
    const description = document.getElementById('editDescription').value;
    const status = document.getElementById('editStatus') ? document.getElementById('editStatus').value : 'active';

    const updateData = {
        title,
        category,
        price,
        contact,
        description,
        status
    };
    console.log('Updating product:', productId, updateData);

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            console.log('Product updated successfully');
            showNotification('Product updated successfully', 'success');
            hideModal(document.getElementById('editProductModal'));
            loadMyProducts(); // Refresh list to show changes
        } else {
            const data = await response.json();
            console.error('Failed to update product:', data);
            showNotification(data.error || 'Failed to update product', 'error');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Network error', 'error');
    }
}



async function adminDeleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showNotification('User deleted successfully', 'success');
            loadAdminData(); // Refresh admin data
        } else {
            showNotification('Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function adminDeleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showNotification('Product deleted successfully', 'success');
            loadAdminData(); // Refresh admin data
        } else {
            showNotification('Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function adminViewUser(userId) {
    // TODO: Implement view user details
    showNotification(`Viewing user ${userId}`, 'info');
}

// Make functions available globally
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.adminDeleteUser = adminDeleteUser;
window.adminDeleteProduct = adminDeleteProduct;
window.adminViewUser = adminViewUser;