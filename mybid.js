// mybid.js - MyBid Sidebar Logic

const MYBID_API_BASE = 'http://localhost/Website-Akhir/api';

let currentUser = null;

// Load all MyBid data
async function loadMyBidData() {
    await loadTabData('history');
    await loadTabData('running');
    await loadTabData('won');
    await loadTabData('profile');
}

// Load specific tab data
async function loadTabData(tabName) {
    switch(tabName) {
        case 'history':
            await loadBidHistory();
            break;
        case 'running':
            await loadRunningBids();
            break;
        case 'won':
            await loadWonProducts();
            break;
        case 'profile':
            await loadProfile();
            break;
    }
}

// Load Bid History (Ended auctions)
async function loadBidHistory() {
    const content = document.getElementById('historyContent');
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading...</p></div>';

    try {
        const response = await fetch(`${MYBID_API_BASE}/user/get_bid_history.php`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            content.innerHTML = result.data.map(bid => {
                const isWinner = bid.is_winner;
                const endDate = new Date(bid.end_time);

                return `
                    <div class="bid-item">
                        <h4>${bid.product_name}</h4>
                        <div class="bid-details">
                            <div class="bid-detail-row">
                                <span>Your Bid:</span>
                                <span class="bid-amount">$${bid.bid_amount.toLocaleString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Final Price:</span>
                                <span>$${bid.final_price.toLocaleString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Ended:</span>
                                <span>${endDate.toLocaleDateString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Status:</span>
                                <span class="status-badge ${isWinner ? 'status-won' : 'status-lost'}">
                                    ${isWinner ? '🏆 WON' : '❌ LOST'}
                                </span>
                            </div>
                            ${isWinner ? `<div class="bid-detail-row"><span>Winner:</span><span><strong>YOU!</strong></span></div>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>No bid history yet</p>
                    <p style="font-size: 0.9em;">Your completed auctions will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading bid history:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>Failed to load bid history</p>
            </div>
        `;
    }
}

// Load Running Bids (Active auctions)
async function loadRunningBids() {
    const content = document.getElementById('runningContent');
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading...</p></div>';

    try {
        const response = await fetch(`${MYBID_API_BASE}/user/get_running_bids.php`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            content.innerHTML = result.data.map(bid => {
                const isHighest = bid.is_highest_bidder;
                const timeLeft = bid.end_time - Date.now();
                const timeLeftStr = formatTimeRemaining(timeLeft);

                return `
                    <div class="bid-item" style="border-left-color: ${isHighest ? '#27ae60' : '#e74c3c'}">
                        <h4>${bid.product_name}</h4>
                        <div class="bid-details">
                            <div class="bid-detail-row">
                                <span>Your Bid:</span>
                                <span class="bid-amount">$${bid.bid_amount.toLocaleString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Current Price:</span>
                                <span>$${bid.current_price.toLocaleString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Time Left:</span>
                                <span style="color: #e74c3c; font-weight: bold;">${timeLeftStr}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Status:</span>
                                <span class="status-badge ${isHighest ? 'status-highest' : 'status-outbid'}">
                                    ${isHighest ? '🥇 HIGHEST BID' : '⚠️ OUTBID'}
                                </span>
                            </div>
                            <button onclick="viewProduct(${bid.product_id})" style="margin-top: 10px; width: 100%; padding: 8px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                View Product
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏳</div>
                    <p>No active bids</p>
                    <p style="font-size: 0.9em;">Place a bid to see it here!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading running bids:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>Failed to load running bids</p>
            </div>
        `;
    }
}

// Load Won Products
async function loadWonProducts() {
    const content = document.getElementById('wonContent');
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading...</p></div>';

    try {
        const response = await fetch(`${MYBID_API_BASE}/user/get_won_products.php`);
        const result = await response.json();

        console.log('Won Products API Response:', result);

        if (result.success && result.data.length > 0) {
            content.innerHTML = result.data.map(product => {
                console.log('Product:', product);
                console.log('Payment Status:', product.payment_status);
                const wonDate = new Date(product.end_time);
                const paymentStatus = product.payment_status || 'pending';
                console.log('Resolved Payment Status:', paymentStatus);

                return `
                    <div class="bid-item" style="border-left-color: #27ae60;">
                        <h4>🏆 ${product.product_name}</h4>
                        <div class="bid-details">
                            <div class="bid-detail-row">
                                <span>Winning Bid:</span>
                                <span class="bid-amount">$${product.winning_bid.toLocaleString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Won On:</span>
                                <span>${wonDate.toLocaleDateString()}</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Total Bids:</span>
                                <span>${product.total_bids} bids</span>
                            </div>
                            <div class="bid-detail-row">
                                <span>Payment Status:</span>
                                <span class="status-badge ${paymentStatus === 'paid' ? 'status-won' : paymentStatus === 'pending' ? 'status-pending' : 'status-lost'}">
                                    ${paymentStatus === 'paid' ? '✅ PAID' : paymentStatus === 'pending' ? '⏳ PENDING' : '❌ CANCELLED'}
                                </span>
                            </div>
                            ${paymentStatus === 'pending' ? `
                                <button onclick="goToPayment(${product.product_id})" style="margin-top: 15px; width: 100%; padding: 12px; background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);">
                                    💳 Pay Now - $${product.winning_bid.toLocaleString()}
                                </button>
                            ` : paymentStatus === 'paid' ? `
                                <div style="margin-top: 10px; padding: 10px; background: #d4edda; border-radius: 5px; text-align: center; color: #155724; font-weight: bold;">
                                    ✅ Payment Completed
                                </div>
                            ` : ''}
                            <div style="margin-top: 10px; padding: 10px; background: #d4edda; border-radius: 5px; text-align: center; color: #155724; font-weight: bold;">
                                🎉 Congratulations! You won this auction!
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏆</div>
                    <p>No products won yet</p>
                    <p style="font-size: 0.9em;">Keep bidding to win your first auction!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading won products:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>Failed to load won products</p>
            </div>
        `;
    }
}

// Load Profile
async function loadProfile() {
    const content = document.getElementById('profileContent');
    content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⏳</div><p>Loading...</p></div>';

    try {
        const response = await fetch(`${MYBID_API_BASE}/user/get_profile.php`);
        const result = await response.json();

        if (result.success) {
            const profile = result.data;
            content.innerHTML = `
                <div class="profile-section">
                    <div class="profile-avatar">👤</div>
                    <h3 style="margin: 0 0 5px 0;">${profile.username}</h3>
                    <p style="margin: 0; opacity: 0.9;">${profile.email}</p>
                </div>

                <div class="profile-stats">
                    <div class="stat-box">
                        <div class="stat-value">${profile.stats.total_bids}</div>
                        <div class="stat-label">Total Bids</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${profile.stats.active_bids}</div>
                        <div class="stat-label">Active Bids</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${profile.stats.won_auctions}</div>
                        <div class="stat-label">Won Auctions</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">$${profile.stats.total_spent.toLocaleString()}</div>
                        <div class="stat-label">Total Spent</div>
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #333;">Account Information</h4>
                    <div style="color: #666; font-size: 0.9em;">
                        <p style="margin: 5px 0;"><strong>Member Since:</strong> ${new Date(profile.member_since).toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Account Type:</strong> ${profile.role.toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>User ID:</strong> #${profile.user_id}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p>Failed to load profile</p>
            </div>
        `;
    }
}

// Format time remaining
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'ENDED';
    
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// View product from sidebar
function viewProduct(productId) {
    closeMyBidSidebar();
    showProduct(productId);
}

// Go to payment page
function goToPayment(productId) {
    window.location.href = `payment.html?product_id=${productId}`;
}