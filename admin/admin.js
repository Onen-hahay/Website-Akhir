// admin/admin.js - Admin Dashboard Logic (FULLY FIXED)

const API_BASE = 'http://localhost/finals/api';
let allProducts = [];
let filteredProducts = [];
let editingProductId = null;

// Check if user is logged in and is admin
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/check_session.php`);
        const result = await response.json();

        if (!result.logged_in || result.data.role !== 'admin') {
            alert('Admin access required!');
            window.location.href = '../login.html';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '../login.html';
        return false;
    }
}

// Load all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/admin/get_all_products.php`);
        const result = await response.json();

        console.log('API Response:', result); // Debug

        if (result.success) {
            allProducts = result.data.products;
            filteredProducts = [...allProducts];
            
            console.log('All Products:', allProducts); // Debug
            
            updateStats(result.data.stats);
            renderProductsTable();
        } else {
            console.error('Failed to load products:', result.message);
            alert('Failed to load products: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Error connecting to server');
    }
}

// Update statistics
function updateStats(stats) {
    document.getElementById('totalProducts').textContent = stats.total;
    document.getElementById('activeAuctions').textContent = stats.active;
    document.getElementById('endedAuctions').textContent = stats.ended;
    document.getElementById('totalBids').textContent = stats.total_bids;
}

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    console.log('Applying filters:', { statusFilter, dateFrom, dateTo });

    filteredProducts = allProducts.filter(product => {
        const currentTime = Date.now();
        const isEnded = currentTime >= product.endTime;
        const productStatus = isEnded ? 'ended' : 'active';
        const productEndDate = new Date(product.endTime);

        // Status filter
        if (statusFilter !== 'all' && productStatus !== statusFilter) {
            console.log(`Product ${product.id} filtered by status: ${productStatus} !== ${statusFilter}`);
            return false;
        }

        // Date from filter
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (productEndDate < fromDate) {
                console.log(`Product ${product.id} filtered by from date`);
                return false;
            }
        }

        // Date to filter
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (productEndDate > toDate) {
                console.log(`Product ${product.id} filtered by to date`);
                return false;
            }
        }

        return true;
    });

    console.log('Filtered products:', filteredProducts.length);
    renderProductsTable();
}

// Reset filters
function resetFilters() {
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    
    filteredProducts = [...allProducts];
    console.log('Filters reset. Showing all products:', filteredProducts.length);
    renderProductsTable();
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');

    console.log('Rendering table with products:', filteredProducts.length);

    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-results">No products found with current filters</td></tr>';
        return;
    }

    tbody.innerHTML = filteredProducts.map(product => {
        // Debug log each product
        console.log('Rendering product:', product);

        const currentTime = Date.now();
        const isEnded = currentTime >= product.endTime;
        
        // Format dates
        const startDate = new Date(product.startTime);
        const endDate = new Date(product.endTime);

        // Format prices - PENTING: pastikan menggunakan field yang benar
        const startPriceFormatted = `$${Number(product.startPrice).toLocaleString()}`;
        const currentPriceFormatted = `$${Number(product.currentPrice).toLocaleString()}`;

        // Status badge
        const statusBadge = isEnded 
            ? '<span class="status-badge status-ended">ENDED</span>'
            : '<span class="status-badge status-active">ACTIVE</span>';

        // Highest bidder / winner display
        let bidderDisplay = '-';
        if (product.highestBidder) {
            if (isEnded) {
                bidderDisplay = `<span class="winner-badge">🏆 ${product.highestBidder}</span>`;
            } else {
                bidderDisplay = `<span class="highest-bidder">🥇 ${product.highestBidder}</span>`;
            }
        }

        return `
            <tr>
                <td>${product.id}</td>
                <td><strong>${product.name}</strong></td>
                <td>${startPriceFormatted}</td>
                <td>${currentPriceFormatted}</td>
                <td>${statusBadge}</td>
                <td>${bidderDisplay}</td>
                <td>${startDate.toLocaleString()}</td>
                <td>${endDate.toLocaleString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-small" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn btn-delete btn-small" onclick="deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Open add product modal
function openAddModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
}

// Edit product
function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) {
        alert('Product not found!');
        return;
    }

    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('startPrice').value = product.startPrice;
    document.getElementById('bidIncrement').value = product.bidIncrement;
    document.getElementById('duration').value = Math.floor(product.duration / 86400000);
    document.getElementById('productModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    editingProductId = null;
}

// Save product (add or update)
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        name: document.getElementById('productName').value.trim(),
        description: document.getElementById('productDescription').value.trim(),
        start_price: parseFloat(document.getElementById('startPrice').value),
        bid_increment: parseFloat(document.getElementById('bidIncrement').value),
        duration: parseInt(document.getElementById('duration').value) * 86400000
    };

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let response;
        
        if (editingProductId) {
            productData.product_id = editingProductId;
            response = await fetch(`${API_BASE}/admin/update_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch(`${API_BASE}/admin/add_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }

        const result = await response.json();

        if (result.success) {
            alert(editingProductId ? 'Product updated successfully!' : 'Product added successfully!');
            closeModal();
            loadProducts();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save product');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Product';
    }
});

// Delete product
async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will also delete all bids for this product.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/admin/delete_product.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: id })
        });

        const result = await response.json();

        if (result.success) {
            alert('Product deleted successfully!');
            loadProducts();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete product');
    }
}

// Logout
async function logout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        await fetch(`${API_BASE}/auth/logout.php`);
        window.location.href = '../login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Initialize
async function init() {
    const isAuth = await checkAuth();
    if (isAuth) {
        await loadProducts();
        
        // Set interval to refresh
        setInterval(loadProducts, 30000);
        
        console.log('Admin dashboard initialized');
    }
}

// Run initialization
init();