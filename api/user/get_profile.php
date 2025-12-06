<?php
// api/user/get_profile.php - Get user profile with statistics

require_once '../../config.php';

// Require login
requireLogin();

$conn = getDBConnection();
$userId = $_SESSION['user_id'];
$username = $_SESSION['username'];

try {
    $currentTime = round(microtime(true) * 1000);

    // Get user info
    $sql = "SELECT * FROM users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    // Get total bids
    $sqlTotalBids = "SELECT COUNT(*) as total FROM bids WHERE bidder_name = ?";
    $stmtBids = $conn->prepare($sqlTotalBids);
    $stmtBids->bind_param("s", $username);
    $stmtBids->execute();
    $totalBids = $stmtBids->get_result()->fetch_assoc()['total'];

    // Get active bids (bids on running auctions)
    $sqlActiveBids = "SELECT COUNT(DISTINCT p.id) as total 
                      FROM bids b 
                      INNER JOIN products p ON b.product_id = p.id 
                      WHERE b.bidder_name = ? AND p.end_time > ?";
    $stmtActive = $conn->prepare($sqlActiveBids);
    $stmtActive->bind_param("si", $username, $currentTime);
    $stmtActive->execute();
    $activeBids = $stmtActive->get_result()->fetch_assoc()['total'];

    // Get won auctions
    $sqlWon = "SELECT COUNT(*) as total FROM products WHERE highest_bidder = ? AND end_time <= ?";
    $stmtWon = $conn->prepare($sqlWon);
    $stmtWon->bind_param("si", $username, $currentTime);
    $stmtWon->execute();
    $wonAuctions = $stmtWon->get_result()->fetch_assoc()['total'];

    // Get total spent (sum of winning bids)
    $sqlSpent = "SELECT COALESCE(SUM(current_price), 0) as total 
                 FROM products 
                 WHERE highest_bidder = ? AND end_time <= ?";
    $stmtSpent = $conn->prepare($sqlSpent);
    $stmtSpent->bind_param("si", $username, $currentTime);
    $stmtSpent->execute();
    $totalSpent = $stmtSpent->get_result()->fetch_assoc()['total'];

    sendJSON([
        'success' => true,
        'data' => [
            'user_id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'member_since' => $user['created_at'],
            'stats' => [
                'total_bids' => (int)$totalBids,
                'active_bids' => (int)$activeBids,
                'won_auctions' => (int)$wonAuctions,
                'total_spent' => (float)$totalSpent
            ]
        ]
    ]);

} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($stmtBids)) $stmtBids->close();
    if (isset($stmtActive)) $stmtActive->close();
    if (isset($stmtWon)) $stmtWon->close();
    if (isset($stmtSpent)) $stmtSpent->close();
    $conn->close();
}
?>