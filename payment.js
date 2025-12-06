// payment.js - Payment processing logic

const API_BASE = 'http://localhost/Website-Akhir/api';
let selectedMethod = null;
let productId = null;
let amount = null;

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
productId = urlParams.get('product_id');

if (!productId) {
    showError('No product specified');
    setTimeout(() => {
        window.location.href = 'mybid.html';
    }, 2000);
}

// Load product details
async function loadProductDetails() {
    try {
        // First, get the list of won products to verify user is the winner
        const wonResponse = await fetch(`${API_BASE}/user/get_won_products.php`);
        const wonResult = await wonResponse.json();

        console.log('Won products:', wonResult);

        if (wonResult.success) {
            // Find this product in the won products list
            const wonProduct = wonResult.data.find(p => p.product_id == productId);

            if (!wonProduct) {
                showError('You did not win this auction');
                setTimeout(() => {
                    window.location.href = 'mybid.html';
                }, 2000);
                return;
            }

            // Set amount and display product details
            amount = wonProduct.winning_bid;

            document.getElementById('productName').textContent = wonProduct.product_name;
            document.getElementById('winningBid').textContent = formatPrice(amount);
            document.getElementById('totalAmount').textContent = formatPrice(amount);

            // Check if already paid
            if (wonProduct.payment_status === 'paid') {
                showError('This product has already been paid for');
                setTimeout(() => {
                    window.location.href = 'mybid.html';
                }, 2000);
                return;
            }
        } else {
            showError('Failed to load product details');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showError('Error loading product details');
    }
}

// Select payment method
function selectPayment(method) {
    selectedMethod = method;

    // Remove selected class from all
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selected class to clicked
    event.currentTarget.classList.add('selected');

    // Enable payment button
    document.getElementById('payButton').disabled = false;
}

// Process payment
async function processPayment() {
    if (!selectedMethod) {
        showError('Please select a payment method');
        return;
    }

    const payButton = document.getElementById('payButton');
    payButton.disabled = true;
    payButton.textContent = 'Processing...';

    try {
        const response = await fetch(`${API_BASE}/process_payment.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                payment_method: selectedMethod,
                amount: amount
            })
        });

        const result = await response.json();

        if (result.success) {
            showSuccess('Payment successful! Redirecting to home...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError(result.message || 'Payment failed. Please try again.');
            payButton.disabled = false;
            payButton.textContent = 'Complete Payment';
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Payment processing failed. Please try again.');
        payButton.disabled = false;
        payButton.textContent = 'Complete Payment';
    }
}

// Helper functions
function formatPrice(price) {
    return '$' + parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showSuccess(message) {
    const successEl = document.getElementById('successMessage');
    successEl.textContent = '✅ ' + message;
    successEl.style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = '❌ ' + message;
    errorEl.style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
}

// Load product details on page load
loadProductDetails();
