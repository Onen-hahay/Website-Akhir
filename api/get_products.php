<?php
// api/get_products.php
require_once '../config.php';

$conn = getDBConnection();

// Query semua produk
$sql = "SELECT * FROM products ORDER BY id ASC";
$result = $conn->query($sql);

$products = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $products[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'startPrice' => (float)$row['start_price'],
            'bidIncrement' => (float)$row['bid_increment'],
            'duration' => (int)$row['duration'],
            'startTime' => (int)$row['start_time'],
            'endTime' => (int)$row['end_time'],
            'currentPrice' => (float)$row['current_price'],
            'highestBidder' => $row['highest_bidder'],
            'status' => $row['status']
        ];
    }
}

echo json_encode([
    'success' => true,
    'data' => $products
]);

$conn->close();
?>