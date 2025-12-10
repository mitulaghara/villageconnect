// API Base URL - Dynamic for production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001/api'
    : '/api';
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001'
    : window.location.origin;

// Global State
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let notifications = [];
let socket = null;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const notificationBell = document.querySelector('.notification-bell');
const notificationsPanel = document.querySelector('.notifications-panel');
const notificationsList = document.querySelector('.notifications-list');

// Initialize App
document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

async function initApp() {
    initSocket();
    checkAuth();
    setupEventListeners();

    if (currentUser) {
        loadNotifications();
    }
}

// Socket.IO Connection
function initSocket() {
    if (typeof io === 'undefined') {
        console.warn('Socket.IO library not loaded');
        return;
    }
    // Auto-detect URL for socket connection
    socket = io(BACKEND_URL);

    socket.on('connect', () => {
        console.log('Connected to VillageConnect server');

        if (currentUser) {
            socket.emit('join', currentUser.id);
        }
    });

    socket.on('new_product', (data) => {
        console.log('New product notification:', data);
        showNotification(data.message, 'info');
        addNotificationToList(data);
        updateNotificationCount();

        // Refresh products if on products page
        if (window.location.pathname.includes('products.html')) {
            if (typeof loadProducts === 'function') {
                loadProducts();
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Authentication Functions
function checkAuth() {
    if (currentUser) {
        updateUIForLoggedInUser();
        updateUserInfo();
    } else {
        updateUIForGuest();
    }
}

function updateUIForLoggedInUser() {
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
}

function updateUIForGuest() {
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function updateUserInfo() {
    // Update user info in dashboard if exists
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userVillageEl = document.getElementById('userVillage');
    const userAvatarEl = document.getElementById('userAvatar');

    if (currentUser && userNameEl) {
        userNameEl.textContent = currentUser.name;
    }

    if (currentUser && userEmailEl) {
        userEmailEl.textContent = currentUser.email;
    }

    if (currentUser && userVillageEl) {
        userVillageEl.textContent = currentUser.village;
    }

    if (currentUser && userAvatarEl) {
        userAvatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
    }

    // Show admin tab if user is admin
    if (currentUser && currentUser.role === 'admin') {
        const adminTab = document.querySelector('.admin-only');
        if (adminTab) adminTab.style.display = 'block';
    }
}

// Event Listeners
function setupEventListeners() {
    // Auth buttons
    if (loginBtn) {
        loginBtn.addEventListener('click', () => showModal('loginModal'));
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => showModal('registerModal'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
            }
        });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Switch between login and register modals
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(document.getElementById('loginModal'));
            showModal('registerModal');
        });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(document.getElementById('registerModal'));
            showModal('loginModal');
        });
    }

    // Notification bell
    if (notificationBell) {
        notificationBell.addEventListener('click', toggleNotifications);
    }

    // Close notifications
    const closeNotifications = document.querySelector('.close-notifications');
    if (closeNotifications) {
        closeNotifications.addEventListener('click', () => {
            notificationsPanel.classList.remove('active');
        });
    }

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');

        if (navLinks && navLinks.classList.contains('active') &&
            !navLinks.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Login Handler
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                updateUserInfo();
                hideModal(document.getElementById('loginModal'));
                showNotification('Login successful!', 'success');

                if (socket) {
                    socket.emit('join', currentUser.id);
                }

                loadNotifications();

                if (window.location.pathname.includes('dashboard.html') ||
                    window.location.pathname.includes('post-product.html')) {
                    window.location.reload();
                }
            } else {
                showNotification(data.error || 'Login failed', 'error');
            }
        } else {
            // Handle non-JSON response (likely a server error page)
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            showNotification('Server Error: Please check console for details', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Register Handler
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const village = document.getElementById('registerVillage').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, phone, village, password })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForLoggedInUser();
                updateUserInfo();
                hideModal(document.getElementById('registerModal'));
                showNotification('Registration successful!', 'success');

                if (socket) {
                    socket.emit('join', currentUser.id);
                }

                window.location.href = 'dashboard.html';
            } else {
                showNotification(data.error || 'Registration failed', 'error');
            }
        } else {
            // Handle non-JSON response
            const text = await response.text();
            console.error('Server returned non-JSON response:', text);
            showNotification('Server Error: Please check console for details', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Logout Handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUIForGuest();
        showNotification('Logged out successfully', 'success');

        // Leave socket room
        if (socket) {
            socket.emit('leave', currentUser?.id);
        }

        // Redirect to home page if on dashboard or profile page
        if (window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('post-product.html')) {
            window.location.href = 'index.html';
        }
    }
}

// Notification Functions
async function loadNotifications() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            notifications = await response.json();
            updateNotificationList();
            updateNotificationCount();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function clearNotifications() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            notifications = [];
            updateNotificationList();
            updateNotificationCount();
            showNotification('Notifications cleared', 'success');
            // Close panel
            if (notificationsPanel) notificationsPanel.classList.remove('active');
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

function updateNotificationList() {
    if (!notificationsList) return;

    // Add Clear All button at the top
    notificationsList.innerHTML = `
        <div style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
            <button onclick="clearNotifications()" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:0.9rem;">
                <i class="fas fa-trash-alt"></i> Clear All
            </button>
        </div>
    `;

    if (notifications.length === 0) {
        notificationsList.innerHTML += '<div style="padding:20px; text-align:center; color:#666;">No notifications</div>';
        return;
    }

    notifications.slice(0, 10).forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
        item.innerHTML = `
            <p>${notification.message}</p>
            <small>${new Date(notification.createdAt).toLocaleString()}</small>
        `;

        item.addEventListener('click', () => {
            if (notification.productId) {
                window.location.href = `product-detail.html?id=${notification.productId}`;
            }
        });

        notificationsList.appendChild(item);
    });
}

function updateNotificationCount() {
    const countElement = document.querySelector('.notification-count');
    if (countElement) {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function addNotificationToList(notification) {
    const item = document.createElement('div');
    item.className = 'notification-item unread';
    item.innerHTML = `
        <p>${notification.message}</p>
        <small>${new Date(notification.timestamp).toLocaleString()}</small>
    `;

    item.addEventListener('click', () => {
        if (notification.productId) {
            window.location.href = `product-detail.html?id=${notification.productId}`;
        }
    });

    if (notificationsList) {
        // Insert after clear button
        const clearBtnDiv = notificationsList.firstElementChild;
        if (clearBtnDiv) {
            notificationsList.insertBefore(item, clearBtnDiv.nextSibling);
        } else {
            notificationsList.appendChild(item);
        }

        // Limit to 10 notifications (excluding header)
        if (notificationsList.children.length > 11) {
            notificationsList.removeChild(notificationsList.lastChild);
        }
    }

    // Add to notifications array
    notifications.unshift({
        ...notification,
        isRead: false,
        createdAt: notification.timestamp
    });

    updateNotificationCount();
}

function toggleNotifications() {
    if (notificationsPanel) {
        notificationsPanel.classList.toggle('active');
    }
}

window.clearNotifications = clearNotifications;

// Utility Functions
function showNotification(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-toast"><i class="fas fa-times"></i></button>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Close button
    toast.querySelector('.close-toast').addEventListener('click', () => {
        toast.remove();
    });

    // Remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Helper function to get category name
function getCategoryName(category) {
    const categories = {
        'agriculture': 'Agriculture',
        'handicrafts': 'Handicrafts',
        'livestock': 'Livestock',
        'fresh_produce': 'Fresh Produce',
        'equipment': 'Equipment',
        'other': 'Other'
    };

    return categories[category] || category;
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Less than 1 week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }

    // Return formatted date
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Export functions for use in other files
window.API_BASE_URL = API_BASE_URL;
window.BACKEND_URL = BACKEND_URL;
window.currentUser = () => currentUser;
window.showNotification = showNotification;
window.showModal = showModal;
window.hideModal = hideModal;
window.getCategoryName = getCategoryName;
window.formatDate = formatDate;