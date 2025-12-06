// script.js - Connected to PHP Backend

// API Base URL - GANTI SESUAI FOLDER ANDA
const API_BASE = 'http://localhost/finals/api';

// Product data storage
let products = [];
let auctionData = {};

// Load products from database
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/get_products.php`);
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            initializeAuctionData();
            renderCatalog();
        } else {
            console.error('Failed to load products:', result.message);
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Cannot connect to server');
    }
}

// Initialize auction data from products
function initializeAuctionData() {
    products.forEach(p => {
        auctionData[p.id] = {
            currentPrice: p.currentPrice,
            startTime: p.startTime,
            endTime: p.endTime,
            highestBidder: p.highestBidder,
            bids: []
        };
    });
}

// Load product details and bids
async function loadProductDetails(productId) {
    try {
        const response = await fetch(`${API_BASE}/get_product.php?id=${productId}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.data.product;
            const bids = result.data.bids;
            
            // Update auction data
            auctionData[productId] = {
                currentPrice: product.currentPrice,
                startTime: product.startTime,
                endTime: product.endTime,
                highestBidder: product.highestBidder,
                bids: bids
            };
            
            return result.data;
        }
    } catch (error) {
        console.error('Error loading product details:', error);
    }
    return null;
}

// Show error message
function showError(message) {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: white; padding: 40px;">
            <h2>❌ ${message}</h2>
            <p>Please make sure XAMPP is running and database is set up correctly.</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">
                Reload Page
            </button>
        </div>
    `;
}

// Format price
function formatPrice(price) {
    return '$' + price.toLocaleString();
}

// Format time remaining
function formatTime(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

// Get time left for auction
function getTimeLeft(productId) {
    const data = auctionData[productId];
    if (!data) return 0;
    const remaining = data.endTime - Date.now();
    return remaining > 0 ? remaining : 0;
}

// Check if auction ended
function isAuctionEnded(productId) {
    return getTimeLeft(productId) === 0;
}

// Render catalog page
function renderCatalog() {
    const grid = document.getElementById('catalogGrid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="color: white; text-align: center; grid-column: 1/-1; font-size: 18px;">Loading products...</p>';
        return;
    }
    
    grid.innerHTML = products.map(p => {
        const data = auctionData[p.id];
        const timeLeft = getTimeLeft(p.id);
        const ended = timeLeft === 0;

        return `
            <div class="product-card" onclick="showProduct(${p.id})">
                <div class="product-image">⌚</div>
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-details">
                        <div class="detail-row">
                            <span class="detail-label">Current Price:</span>
                            <span class="detail-value current-price">${formatPrice(data.currentPrice)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Bid Increment:</span>
                            <span class="detail-value">${formatPrice(p.bidIncrement)}</span>
                        </div>
                    </div>
                    <div class="timer">
                        <div class="timer-label">${ended ? 'Auction Ended' : 'Time Left'}</div>
                        <div class="timer-value" id="timer-${p.id}">
                            ${ended ? 'ENDED' : formatTime(timeLeft)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show product detail page
async function showProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Show loading
    document.getElementById('catalog').style.display = 'none';
    const page = document.getElementById('productPage');
    page.className = 'product-page active';
    page.innerHTML = '<p style="text-align: center; padding: 40px;">Loading...</p>';
    
    // Load fresh data from server
    const productData = await loadProductDetails(id);
    if (!productData) {
        page.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">Failed to load product</p>';
        return;
    }
    
    const data = auctionData[id];
    const ended = isAuctionEnded(id);
    const timeLeft = getTimeLeft(id);
    
    page.innerHTML = `
        <button class="back-button" onclick="showCatalog()">← Back to Catalog</button>
        
        <div class="product-detail-container">
            <div class="product-detail-image">⌚</div>
            <div class="product-detail-info">
                <h2>${product.name}</h2>
                <p style="color: #666; margin-bottom: 20px;">${product.description}</p>
                
                <div class="info-section">
                    <h3>CURRENT BID</h3>
                    <p class="current-price" id="current-price-${id}">${formatPrice(data.currentPrice)}</p>
                </div>
                
                <div class="info-section">
                    <h3>BID INCREMENT</h3>
                    <p>${formatPrice(product.bidIncrement)}</p>
                </div>
                
                <div class="info-section">
                    <h3>TIME REMAINING</h3>
                    <p id="detail-timer-${id}" style="color: ${ended ? '#e74c3c' : '#27ae60'}">
                        ${ended ? 'AUCTION ENDED' : formatTime(timeLeft)}
                    </p>
                </div>
                
                ${data.highestBidder ? `
                    <div class="info-section">
                        <h3>HIGHEST BIDDER</h3>
                        <p style="color: #e74c3c;">${data.highestBidder}</p>
                    </div>
                ` : ''}
            </div>
        </div>

        ${ended ? `
            <div class="auction-ended">
                This auction has ended
            </div>
            ${data.highestBidder ? `
                <div class="winner-announcement">
                    <h3>🏆 Winner: ${data.highestBidder}</h3>
                    <p>Winning Bid: ${formatPrice(data.currentPrice)}</p>
                </div>
            ` : '<p style="text-align: center; color: #666; margin-top: 20px;">No bids were placed</p>'}
        ` : `
            <div class="bidding-section">
                <h3>Place Your Bid</h3>
                <p>Minimum bid: <strong>${formatPrice(data.currentPrice + product.bidIncrement)}</strong></p>
                
                <div class="bid-input-group">
                    <input type="number" 
                           id="bidAmount" 
                           class="bid-input" 
                           placeholder="Enter bid amount"
                           min="${data.currentPrice + product.bidIncrement}"
                           step="0.01">
                    <button class="bid-button" onclick="placeBid(${id})" id="bidButton">Place Bid</button>
                </div>
                
                <div class="bid-history">
                    <h4>Recent Bids:</h4>
                    <div id="bidHistory-${id}">
                        ${data.bids.length === 0 ? '<p style="color: #666; padding: 10px;">No bids yet. Be the first!</p>' : 
                        data.bids.map((bid) => `
                            <div class="bid-history-item">
                                <span><strong>${bid.bidder}</strong></span>
                                <span style="font-weight: bold; color: #e74c3c;">${formatPrice(bid.amount)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `}
    `;
}

// Show catalog page
function showCatalog() {
    document.getElementById('catalog').style.display = 'block';
    document.getElementById('productPage').className = 'product-page';
    loadProducts(); // Refresh data
}

// Place a bid
async function placeBid(productId) {
    const product = products.find(p => p.id === productId);
    const data = auctionData[productId];
    const bidInput = document.getElementById('bidAmount');
    const bidButton = document.getElementById('bidButton');
    const bidAmount = parseFloat(bidInput.value);

    if (isAuctionEnded(productId)) {
        alert('This auction has ended!');
        return;
    }

    const minBid = data.currentPrice + product.bidIncrement;

    if (!bidAmount || bidAmount < minBid) {
        alert(`Please enter a bid of at least ${formatPrice(minBid)}`);
        return;
    }

    const bidderName = prompt('Enter your name:');
    if (!bidderName || bidderName.trim() === '') {
        alert('Name is required!');
        return;
    }

    // Disable button during submission
    bidButton.disabled = true;
    bidButton.textContent = 'Placing Bid...';

    // Send bid to server
    try {
        const response = await fetch(`${API_BASE}/place_bid.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                bidder_name: bidderName.trim(),
                bid_amount: bidAmount
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ Bid placed successfully!');
            bidInput.value = '';
            // Reload product page to show updated data
            await showProduct(productId);
        } else {
            alert('❌ Failed to place bid: ' + result.message);
            bidButton.disabled = false;
            bidButton.textContent = 'Place Bid';
        }
    } catch (error) {
        console.error('Error placing bid:', error);
        alert('❌ Error placing bid. Please check your connection and try again.');
        bidButton.disabled = false;
        bidButton.textContent = 'Place Bid';
    }
}

// Update timers every second
function updateTimers() {
    products.forEach(p => {
        const timerEl = document.getElementById(`timer-${p.id}`);
        const detailTimerEl = document.getElementById(`detail-timer-${p.id}`);
        const timeLeft = getTimeLeft(p.id);
        const ended = timeLeft === 0;

        if (timerEl) {
            timerEl.textContent = ended ? 'ENDED' : formatTime(timeLeft);
            if (ended) timerEl.style.color = '#e74c3c';
        }

        if (detailTimerEl) {
            detailTimerEl.textContent = ended ? 'AUCTION ENDED' : formatTime(timeLeft);
            detailTimerEl.style.color = ended ? '#e74c3c' : '#27ae60';
        }
    });
}

// Update auction status periodically
async function updateAuctionStatus() {
    try {
        await fetch(`${API_BASE}/update_auction_status.php`);
    } catch (error) {
        console.error('Error updating auction status:', error);
    }
}

// Initialize app
console.log('🚀 Starting Watch Auction App...');
console.log('📡 API Base URL:', API_BASE);

loadProducts();
setInterval(updateTimers, 1000);
setInterval(updateAuctionStatus, 60000); // Update status every minute
setInterval(loadProducts, 30000); // Refresh products every 30 seconds