<?php
// api/user/get_bid_history.php - Get user's bid history (ended auctions)

require_once '../../config.php';

// Require login
requireLogin();

$conn = getDBConnection();
$userId = $_SESSION['user_id'];
$username = $_SESSION['username'];

try {
    $currentTime = round(microtime(true) * 1000);

    // Get all bids from user on ended auctions
    $sql = "SELECT 
                b.bid_amount,
                b.bid_time,
                p.id as product_id,
                p.name as product_name,
                p.current_price as final_price,
                p.end_time,
                p.highest_bidder,
                (p.highest_bidder = ?) as is_winner
            FROM bids b
            INNER JOIN products p ON b.product_id = p.id
            WHERE b.bidder_name = ? AND p.end_time <= ?
            GROUP BY p.id, b.bid_amount, b.bid_time
            ORDER BY p.end_time DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssi", $username, $username, $currentTime);
    $stmt->execute();
    $result = $stmt->get_result();

    $bidHistory = [];
    while($row = $result->fetch_assoc()) {
        $bidHistory[] = [
            'product_id' => (int)$row['product_id'],
            'product_name' => $row['product_name'],
            'bid_amount' => (float)$row['bid_amount'],
            'final_price' => (float)$row['final_price'],
            'end_time' => (int)$row['end_time'],
            'is_winner' => (bool)$row['is_winner']
        ];
    }

    sendJSON([
        'success' => true,
        'count' => count($bidHistory),
        'data' => $bidHistory
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