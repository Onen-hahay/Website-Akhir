<?php
// api/user/get_won_products.php - Get products won by user

require_once '../../config.php';

// Require login
requireLogin();

$conn = getDBConnection();
$userId = $_SESSION['user_id'];
$username = $_SESSION['username'];

try {
    $currentTime = round(microtime(true) * 1000);

    // Get all products won by user
    $sql = "SELECT
                p.id as product_id,
                p.name as product_name,
                p.current_price as winning_bid,
                p.end_time,
                p.payment_status,
                p.payment_method,
                p.payment_date,
                (SELECT COUNT(*) FROM bids WHERE product_id = p.id) as total_bids
            FROM products p
            WHERE p.highest_bidder = ? AND p.end_time <= ?
            ORDER BY p.end_time DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $username, $currentTime);
    $stmt->execute();
    $result = $stmt->get_result();

    $wonProducts = [];
    while($row = $result->fetch_assoc()) {
        $wonProducts[] = [
            'product_id' => (int)$row['product_id'],
            'product_name' => $row['product_name'],
            'winning_bid' => (float)$row['winning_bid'],
            'end_time' => (int)$row['end_time'],
            'total_bids' => (int)$row['total_bids'],
            'payment_status' => $row['payment_status'] ?? 'pending',
            'payment_method' => $row['payment_method'],
            'payment_date' => $row['payment_date']
        ];
    }

    sendJSON([
        'success' => true,
        'count' => count($wonProducts),
        'data' => $wonProducts
    ]);

} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
} finally {
    if (isset($stmt)) $stmt->close();
    $conn->close();
}
?>