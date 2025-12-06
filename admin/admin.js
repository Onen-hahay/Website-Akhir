// admin/admin.js - Admin Dashboard Logic (FULLY FIXED)

const API_BASE = 'http://localhost/Website-Akhir/api';
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
        tbody.innerHTML = '<tr><td colspan="10" class="no-results">No products found with current filters</td></tr>';
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

        // Payment status display
        let paymentDisplay = '-';
        if (isEnded && product.highestBidder) {
            const paymentStatus = product.paymentStatus || 'pending';
            if (paymentStatus === 'paid') {
                paymentDisplay = '<span class="status-badge status-paid">✅ PAID</span>';
            } else if (paymentStatus === 'pending') {
                paymentDisplay = '<span class="status-badge status-pending">⏳ PENDING</span>';
            } else {
                paymentDisplay = '<span class="status-badge status-cancelled">❌ CANCELLED</span>';
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
                <td>${paymentDisplay}</td>
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

// Store uploaded images
let uploadedImages = [];

// Handle image preview
document.getElementById('productImages').addEventListener('change', function(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('imagePreviewContainer');
    previewContainer.innerHTML = '';

    if (files.length > 5) {
        alert('Maximum 5 images allowed');
        e.target.value = '';
        return;
    }

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const imgDiv = document.createElement('div');
            imgDiv.style.cssText = 'position: relative; border: 2px solid #ddd; border-radius: 5px; overflow: hidden;';
            imgDiv.innerHTML = `
                <img src="${event.target.result}" style="width: 100%; height: 100px; object-fit: cover;">
                <div style="position: absolute; top: 5px; right: 5px; background: ${index === 0 ? '#27ae60' : '#3498db'}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.7em;">
                    ${index === 0 ? 'PRIMARY' : index + 1}
                </div>
            `;
            previewContainer.appendChild(imgDiv);
        };
        reader.readAsDataURL(file);
    });
});

// Open add product modal
function openAddModal() {
    editingProductId = null;
    uploadedImages = [];
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreviewContainer').innerHTML = '';
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

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    // Keep the product form modal open so user can edit
    document.getElementById('productModal').classList.add('active');
}

// Temporary storage for product data being reviewed
let pendingProductData = null;

// Show review/preview modal
function showReviewModal(productData) {
    // Store the data for later publishing
    pendingProductData = productData;

    // Populate review fields
    document.getElementById('reviewName').textContent = productData.name;
    document.getElementById('reviewDescription').textContent = productData.description;
    document.getElementById('reviewStartPrice').textContent = `$${productData.start_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('reviewBidIncrement').textContent = `$${productData.bid_increment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    const durationDays = Math.floor(productData.duration / 86400000);
    document.getElementById('reviewDuration').textContent = `${durationDays} day${durationDays > 1 ? 's' : ''}`;

    // Calculate and show estimated end time
    const endTime = new Date(Date.now() + productData.duration);
    document.getElementById('reviewEndTime').textContent = endTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Close product form modal and open review modal
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('reviewModal').classList.add('active');
}

// Confirm and publish product
async function confirmAndPublish() {
    if (!pendingProductData) {
        alert('No product data to publish!');
        return;
    }

    const publishBtn = document.getElementById('publishBtn');
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publishing...';

    try {
        let response;
        let productId;

        if (editingProductId) {
            pendingProductData.product_id = editingProductId;
            response = await fetch(`${API_BASE}/admin/update_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingProductData)
            });
            productId = editingProductId;
        } else {
            // Create product first
            response = await fetch(`${API_BASE}/admin/add_product.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingProductData)
            });

            const result = await response.json();
            if (!result.success) {
                alert('Error: ' + result.message);
                return;
            }
            productId = result.data.product_id;
        }

        // Upload images to database after product creation
        publishBtn.textContent = 'Uploading images...';
        await uploadProductImages(productId);

        alert(editingProductId ? '✅ Product updated successfully!' : '✅ Product published successfully! Auction is now live.');
        document.getElementById('reviewModal').classList.remove('active');
        pendingProductData = null;
        editingProductId = null;
        loadProducts();

    } catch (error) {
        console.error('Publish error:', error);
        alert('Failed to publish product: ' + error.message);
    } finally {
        publishBtn.disabled = false;
        publishBtn.textContent = '✓ Confirm & Publish';
    }
}

// Upload images to database (BLOB storage)
async function uploadProductImages(productId) {
    const fileInput = document.getElementById('productImages');
    const files = fileInput.files;

    if (files.length === 0) {
        return;
    }

    const formData = new FormData();
    formData.append('product_id', productId);

    for (let i = 0; i < files.length; i++) {
        formData.append('images[]', files[i]);
    }

    try {
        const response = await fetch(`${API_BASE}/admin/upload_product_images.php`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
}

// Handle form submission - show review instead of saving directly
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Processing...';

    try {
        const productData = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            start_price: parseFloat(document.getElementById('startPrice').value),
            bid_increment: parseFloat(document.getElementById('bidIncrement').value),
            duration: parseInt(document.getElementById('duration').value) * 86400000
        };

        // For editing existing products, skip review and update directly
        if (editingProductId) {
            saveBtn.textContent = 'Saving...';

            try {
                productData.product_id = editingProductId;
                const response = await fetch(`${API_BASE}/admin/update_product.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });

                const result = await response.json();

                if (result.success) {
                    // Upload images if any selected
                    saveBtn.textContent = 'Uploading images...';
                    await uploadProductImages(editingProductId);

                    alert('✅ Product updated successfully!');
                    closeModal();
                    loadProducts();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                console.error('Update error:', error);
                alert('Failed to update product: ' + error.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Preview Product';
            }
        } else {
            // For new products, show review modal
            saveBtn.textContent = 'Preview Product';
            showReviewModal(productData);
        }
    } catch (error) {
        console.error('Form submission error:', error);
        alert('Error: ' + error.message);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Preview Product';
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