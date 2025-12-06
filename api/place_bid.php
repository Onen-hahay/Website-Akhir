<?php
// api/place_bid.php
require_once '../config.php';

// Require user to be logged in
requireLogin();

// Check if user is admin - admins cannot bid
$currentUser = getCurrentUser();
if ($currentUser['role'] === 'admin') {
    sendJSON([
        'success' => false,
        'message' => 'Admins are not allowed to place bids. Please use a regular user account.'
    ], 403);
}

$conn = getDBConnection();

// Get logged-in user's username
$bidderName = $currentUser['username'];

// Ambil data dari request
$data = json_decode(file_get_contents('php://input'), true);

$productId = isset($data['product_id']) ? (int)$data['product_id'] : 0;
$bidAmount = isset($data['bid_amount']) ? (float)$data['bid_amount'] : 0;

// Validasi
if ($productId <= 0 || $bidAmount <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid input data'
    ]);
    exit;
}

// Cek produk
$sql = "SELECT * FROM products WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $productId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Product not found'
    ]);
    exit;
}

$product = $result->fetch_assoc();

// Cek apakah auction sudah berakhir
$currentTime = round(microtime(true) * 1000);
if ($currentTime >= $product['end_time']) {
    echo json_encode([
        'success' => false,
        'message' => 'Auction has ended'
    ]);
    exit;
}

// Cek minimum bid
$minBid = $product['current_price'] + $product['bid_increment'];
if ($bidAmount < $minBid) {
    echo json_encode([
        'success' => false,
        'message' => 'Bid must be at least $' . number_format($minBid, 2)
    ]);
    exit;
}

// Insert bid ke database
$bidTime = round(microtime(true) * 1000);
$sqlInsert = "INSERT INTO bids (product_id, bidder_name, bid_amount, bid_time) VALUES (?, ?, ?, ?)";
$stmtInsert = $conn->prepare($sqlInsert);
$stmtInsert->bind_param("isdi", $productId, $bidderName, $bidAmount, $bidTime);

if (!$stmtInsert->execute()) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to place bid'
    ]);
    exit;
}

// Update produk dengan current price dan highest bidder
$sqlUpdate = "UPDATE products SET current_price = ?, highest_bidder = ? WHERE id = ?";
$stmtUpdate = $conn->prepare($sqlUpdate);
$stmtUpdate->bind_param("dsi", $bidAmount, $bidderName, $productId);
$stmtUpdate->execute();

echo json_encode([
    'success' => true,
    'message' => 'Bid placed successfully',
    'data' => [
        'current_price' => $bidAmount,
        'highest_bidder' => $bidderName
    ]
]);

$stmt->close();
$stmtInsert->close();
$stmtUpdate->close();
$conn->close();
?>