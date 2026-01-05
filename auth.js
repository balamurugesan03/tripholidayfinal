// Global authentication utilities for Trip Holiday

// Check if user is logged in
function isUserLoggedIn() {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    return token && userData;
}

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Update navigation based on auth state
function updateNavigation() {
    if (isUserLoggedIn()) {
        // Show user menu, hide login/register
        const loginItem = document.getElementById('loginNavItem');
        const registerItem = document.getElementById('registerNavItem');
        const userItem = document.getElementById('userNavItem');
        const logoutItem = document.getElementById('logoutNavItem');

        if (loginItem) loginItem.classList.add('hidden');
        if (registerItem) registerItem.classList.add('hidden');
        if (userItem) userItem.classList.remove('hidden');
        if (logoutItem) logoutItem.classList.remove('hidden');

        // Update user name
        const user = getCurrentUser();
        const nameElement = document.getElementById('navUserName');
        if (nameElement && user) {
            nameElement.textContent = user.name;
        }
    } else {
        // Show login/register, hide user menu
        const loginItem = document.getElementById('loginNavItem');
        const registerItem = document.getElementById('registerNavItem');
        const userItem = document.getElementById('userNavItem');
        const logoutItem = document.getElementById('logoutNavItem');

        if (loginItem) loginItem.classList.remove('hidden');
        if (registerItem) registerItem.classList.remove('hidden');
        if (userItem) userItem.classList.add('hidden');
        if (logoutItem) logoutItem.classList.add('hidden');
    }
}

// Verify token with backend
async function verifyUserToken() {
    const token = localStorage.getItem('userToken');
    if (!token) return false;

    try {
        const response = await fetch('http://localhost:5000/api/user/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Update user data in localStorage
            localStorage.setItem('userData', JSON.stringify(data.user));
            return true;
        } else {
            // Token invalid, clear storage
            userLogout();
            return false;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

// Logout function
function userLogout(event) {
    if (event) event.preventDefault();

    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('redirectAfterLogin');

    // Redirect to home page
    window.location.href = 'index.html';
}

// Make API call with authentication
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('userToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If 401 Unauthorized, logout and redirect
    if (response.status === 401) {
        userLogout();
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    return response;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#FF7F27'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast animations to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
});
