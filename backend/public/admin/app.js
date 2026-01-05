// API Configuration
const API_BASE = window.location.origin + '/api';
let allPackages = [];
let editingPackageId = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAdminInfo();
    loadDashboard();
    setupEventListeners();
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
}

// Load admin info
function loadAdminInfo() {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    document.getElementById('adminName').textContent = adminUser.name || 'Admin';
    document.getElementById('adminRole').textContent = adminUser.role || 'Administrator';
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // Filters
    document.getElementById('searchPackages')?.addEventListener('input', filterPackages);
    document.getElementById('filterType')?.addEventListener('change', filterPackages);
    document.getElementById('filterDestination')?.addEventListener('change', filterPackages);
    document.getElementById('filterStatus')?.addEventListener('change', filterPackages);

    // Package form
    document.getElementById('packageForm')?.addEventListener('submit', handlePackageSubmit);
}

// Switch section
function switchSection(section) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}-section`).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        packages: 'Packages Management',
        bookings: 'Bookings',
        settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[section];

    // Load section data
    if (section === 'dashboard') {
        loadDashboard();
    } else if (section === 'packages') {
        loadPackages();
    }
}

// Load dashboard
async function loadDashboard() {
    showLoading();
    try {
        await loadStats();
        await loadRecentPackages();
    } catch (error) {
        showToast('Error loading dashboard', 'error');
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetchAPI('/admin/stats');
        if (response.success) {
            const { stats } = response;
            document.getElementById('totalPackages').textContent = stats.totalPackages;
            document.getElementById('activePackages').textContent = stats.activePackages;
            document.getElementById('popularPackages').textContent = stats.popularPackages;
            document.getElementById('inactivePackages').textContent = stats.inactivePackages;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent packages
async function loadRecentPackages() {
    try {
        const response = await fetchAPI('/admin/packages');
        if (response.success) {
            const recent = response.packages.slice(0, 5);
            const container = document.getElementById('recentPackages');
            container.innerHTML = recent.map(pkg => `
                <div class="package-preview-item">
                    <img src="${pkg.image}" alt="${pkg.title}" class="package-img">
                    <div>
                        <h4>${pkg.title}</h4>
                        <p>₹${pkg.price.toLocaleString('en-IN')} | ${pkg.durationText}</p>
                    </div>
                    <span class="badge badge-${pkg.active ? 'active' : 'inactive'}">
                        ${pkg.active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent packages:', error);
    }
}

// Load packages
async function loadPackages() {
    showLoading();
    try {
        const response = await fetchAPI('/admin/packages');
        if (response.success) {
            allPackages = response.packages;
            displayPackages(allPackages);
        }
    } catch (error) {
        showToast('Error loading packages', 'error');
    } finally {
        hideLoading();
    }
}

// Display packages in table
function displayPackages(packages) {
    const tbody = document.getElementById('packagesTableBody');
    if (!packages || packages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem;">No packages found</td></tr>';
        return;
    }

    tbody.innerHTML = packages.map(pkg => `
        <tr>
            <td><img src="${pkg.image}" alt="${pkg.title}" class="package-img"></td>
            <td><strong>${pkg.title}</strong></td>
            <td><span class="badge badge-${pkg.type}">${pkg.type}</span></td>
            <td>${pkg.destination}</td>
            <td>₹${pkg.price.toLocaleString('en-IN')}</td>
            <td>${pkg.durationText}</td>
            <td><span class="badge badge-${pkg.active ? 'active' : 'inactive'}">${pkg.active ? 'Active' : 'Inactive'}</span></td>
            <td>${pkg.popular ? '⭐ Yes' : 'No'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editPackage('${pkg.id}')" title="Edit">✏️</button>
                    <button class="btn-icon btn-toggle" onclick="togglePackage('${pkg.id}')" title="Toggle Status">🔄</button>
                    <button class="btn-icon btn-delete" onclick="deletePackage('${pkg.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter packages
function filterPackages() {
    const search = document.getElementById('searchPackages').value.toLowerCase();
    const type = document.getElementById('filterType').value;
    const destination = document.getElementById('filterDestination').value;
    const status = document.getElementById('filterStatus').value;

    const filtered = allPackages.filter(pkg => {
        const matchSearch = pkg.title.toLowerCase().includes(search) ||
                          pkg.description.toLowerCase().includes(search);
        const matchType = type === 'all' || pkg.type === type;
        const matchDestination = destination === 'all' || pkg.destination === destination;
        const matchStatus = status === 'all' ||
                          (status === 'active' && pkg.active) ||
                          (status === 'inactive' && !pkg.active);

        return matchSearch && matchType && matchDestination && matchStatus;
    });

    displayPackages(filtered);
}

// Open add package modal
function openAddPackageModal() {
    editingPackageId = null;
    document.getElementById('modalTitle').textContent = 'Add New Package';
    document.getElementById('packageForm').reset();
    document.getElementById('itineraryDays').innerHTML = '';
    addItineraryDay(); // Add first day
    document.getElementById('packageModal').classList.add('show');
}

// Open edit package modal
async function editPackage(packageId) {
    showLoading();
    try {
        const response = await fetchAPI(`/admin/packages/${packageId}`);
        if (response.success) {
            editingPackageId = packageId;
            const pkg = response.package;

            document.getElementById('modalTitle').textContent = 'Edit Package';
            document.getElementById('packageId').value = pkg.id;
            document.getElementById('packageId').disabled = true; // Can't change ID
            document.getElementById('packageTitle').value = pkg.title;
            document.getElementById('packageDescription').value = pkg.description;
            document.getElementById('packageImage').value = pkg.image;
            document.getElementById('packagePrice').value = pkg.price;
            document.getElementById('packageDuration').value = pkg.duration;
            document.getElementById('packageType').value = pkg.type;
            document.getElementById('packageDestination').value = pkg.destination;
            document.getElementById('packageTravel').value = pkg.travel;
            document.getElementById('packageTags').value = pkg.tags.join(', ');
            document.getElementById('packagePopular').checked = pkg.popular;
            document.getElementById('packagePopularBadge').value = pkg.popularBadge || '';
            document.getElementById('packageActive').checked = pkg.active;
            document.getElementById('itineraryTitle').value = pkg.itinerary.title;
            document.getElementById('itinerarySubtitle').value = pkg.itinerary.subtitle;

            // Load itinerary days
            document.getElementById('itineraryDays').innerHTML = '';
            pkg.itinerary.days.forEach(day => {
                addItineraryDay(day);
            });

            document.getElementById('packageModal').classList.add('show');
        }
    } catch (error) {
        showToast('Error loading package', 'error');
    } finally {
        hideLoading();
    }
}

// Close package modal
function closePackageModal() {
    document.getElementById('packageModal').classList.remove('show');
    document.getElementById('packageId').disabled = false;
    editingPackageId = null;
}

// Add itinerary day
let dayCounter = 0;
function addItineraryDay(dayData = null) {
    dayCounter++;
    const dayNumber = dayData ? dayData.day : dayCounter;
    const container = document.getElementById('itineraryDays');

    const dayDiv = document.createElement('div');
    dayDiv.className = 'itinerary-day';
    dayDiv.dataset.day = dayNumber;
    dayDiv.innerHTML = `
        <div class="itinerary-day-header">
            <h4>Day ${dayNumber}</h4>
            <button type="button" class="btn-remove-day" onclick="removeItineraryDay(this)">Remove</button>
        </div>
        <div class="form-group">
            <label>Day Title</label>
            <input type="text" class="day-title" required placeholder="e.g., Arrival in Dubai"
                   value="${dayData ? dayData.title : ''}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="day-description" required rows="3"
                      placeholder="Detailed description of the day's activities">${dayData ? dayData.description : ''}</textarea>
        </div>
        <div class="form-group">
            <label>Highlights (comma separated)</label>
            <input type="text" class="day-highlights" required
                   placeholder="Airport Transfer, Hotel Check-in, Welcome Drink"
                   value="${dayData ? dayData.highlights.join(', ') : ''}">
        </div>
    `;
    container.appendChild(dayDiv);
}

// Remove itinerary day
function removeItineraryDay(button) {
    button.closest('.itinerary-day').remove();
}

// Handle package form submit
async function handlePackageSubmit(e) {
    e.preventDefault();

    const formData = {
        id: document.getElementById('packageId').value,
        title: document.getElementById('packageTitle').value,
        description: document.getElementById('packageDescription').value,
        image: document.getElementById('packageImage').value,
        price: parseInt(document.getElementById('packagePrice').value),
        duration: parseInt(document.getElementById('packageDuration').value),
        type: document.getElementById('packageType').value,
        destination: document.getElementById('packageDestination').value,
        travel: document.getElementById('packageTravel').value,
        tags: document.getElementById('packageTags').value.split(',').map(t => t.trim()),
        popular: document.getElementById('packagePopular').checked,
        popularBadge: document.getElementById('packagePopularBadge').value || 'Most Popular',
        active: document.getElementById('packageActive').checked,
        itinerary: {
            title: document.getElementById('itineraryTitle').value,
            subtitle: document.getElementById('itinerarySubtitle').value,
            days: []
        }
    };

    // Collect itinerary days
    const dayElements = document.querySelectorAll('.itinerary-day');
    dayElements.forEach((dayEl, index) => {
        const day = {
            day: index + 1,
            title: dayEl.querySelector('.day-title').value,
            description: dayEl.querySelector('.day-description').value,
            highlights: dayEl.querySelector('.day-highlights').value.split(',').map(h => h.trim())
        };
        formData.itinerary.days.push(day);
    });

    showLoading();
    try {
        let response;
        if (editingPackageId) {
            // Update existing package
            response = await fetchAPI(`/admin/packages/${editingPackageId}`, 'PUT', formData);
        } else {
            // Create new package
            response = await fetchAPI('/admin/packages', 'POST', formData);
        }

        if (response.success) {
            showToast(editingPackageId ? 'Package updated successfully' : 'Package created successfully', 'success');
            closePackageModal();
            loadPackages();
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                loadDashboard();
            }
        } else {
            showToast(response.message || 'Error saving package', 'error');
        }
    } catch (error) {
        showToast('Error saving package', 'error');
    } finally {
        hideLoading();
    }
}

// Toggle package active status
async function togglePackage(packageId) {
    if (!confirm('Are you sure you want to toggle this package status?')) {
        return;
    }

    showLoading();
    try {
        const response = await fetchAPI(`/admin/packages/${packageId}/toggle`, 'PATCH');
        if (response.success) {
            showToast('Package status updated', 'success');
            loadPackages();
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                loadDashboard();
            }
        }
    } catch (error) {
        showToast('Error updating package status', 'error');
    } finally {
        hideLoading();
    }
}

// Delete package
async function deletePackage(packageId) {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
        return;
    }

    showLoading();
    try {
        const response = await fetchAPI(`/admin/packages/${packageId}`, 'DELETE');
        if (response.success) {
            showToast('Package deleted successfully', 'success');
            loadPackages();
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                loadDashboard();
            }
        }
    } catch (error) {
        showToast('Error deleting package', 'error');
    } finally {
        hideLoading();
    }
}

// Fetch API helper
async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('adminToken');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (response.status === 401) {
        logout();
        return;
    }

    return await response.json();
}

// Show loading
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

// Hide loading
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Get toast icon
function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}
