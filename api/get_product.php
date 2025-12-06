<?php
// api/get_product.php
require_once '../config.php';

$conn = getDBConnection();

$productId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($productId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid product ID'
    ]);
    exit;
}

// Query produk
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

// Query bids untuk produk ini
$sqlBids = "SELECT * FROM bids WHERE product_id = ? ORDER BY bid_time DESC";
$stmtBids = $conn->prepare($sqlBids);
$stmtBids->bind_param("i", $productId);
$stmtBids->execute();
$resultBids = $stmtBids->get_result();

$bids = [];
while($bid = $resultBids->fetch_assoc()) {
    $bids[] = [
        'bidder' => $bid['bidder_name'],
        'amount' => (float)$bid['bid_amount'],
        'time' => (int)$bid['bid_time']
    ];
}

echo json_encode([
    'success' => true,
    'data' => [
        'product' => [
            'id' => (int)$product['id'],
            'name' => $product['name'],
            'description' => $product['description'],
            'startPrice' => (float)$product['start_price'],
            'bidIncrement' => (float)$product['bid_increment'],
            'duration' => (int)$product['duration'],
            'startTime' => (int)$product['start_time'],
            'endTime' => (int)$product['end_time'],
            'currentPrice' => (float)$product['current_price'],
            'highestBidder' => $product['highest_bidder'],
            'status' => $product['status']
        ],
        'bids' => $bids
    ]
]);

$stmt->close();
$stmtBids->close();
$conn->close();
?>