<?php
// api/admin/get_all_products.php - Get all products with stats (Admin only) - FIXED

require_once '../../config.php';

// Require admin access
requireAdmin();

$conn = getDBConnection();

try {
    // Get all products
    $sql = "SELECT
                p.id,
                p.name,
                p.description,
                p.start_price,
                p.bid_increment,
                p.duration,
                p.start_time,
                p.end_time,
                p.current_price,
                p.highest_bidder,
                p.status,
                p.payment_status,
                p.payment_method,
                p.payment_date,
                p.created_at
            FROM products p
            ORDER BY p.created_at DESC";
    
    $result = $conn->query($sql);

    $products = [];
    $activeCount = 0;
    $endedCount = 0;
    $currentTime = round(microtime(true) * 1000);

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $isEnded = $currentTime >= (int)$row['end_time'];

            if ($isEnded) {
                $endedCount++;
            } else {
                $activeCount++;
            }

            $productId = (int)$row['id'];

            // Get product images (now returns image IDs for BLOB retrieval)
            $imgSql = "SELECT id, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC";
            $imgStmt = $conn->prepare($imgSql);
            $imgStmt->bind_param("i", $productId);
            $imgStmt->execute();
            $imgResult = $imgStmt->get_result();

            $images = [];
            $primaryImageId = null;
            while($imgRow = $imgResult->fetch_assoc()) {
                $imageId = (int)$imgRow['id'];
                $images[] = $imageId;
                if ($imgRow['is_primary'] == 1) {
                    $primaryImageId = $imageId;
                }
            }
            $imgStmt->close();

            $products[] = [
                'id' => $productId,
                'name' => $row['name'],
                'description' => $row['description'],
                'startPrice' => (float)$row['start_price'],
                'bidIncrement' => (float)$row['bid_increment'],
                'duration' => (int)$row['duration'],
                'startTime' => (int)$row['start_time'],
                'endTime' => (int)$row['end_time'],
                'currentPrice' => (float)$row['current_price'],
                'highestBidder' => $row['highest_bidder'],
                'status' => $isEnded ? 'ended' : 'active',
                'paymentStatus' => $row['payment_status'] ?? 'pending',
                'paymentMethod' => $row['payment_method'],
                'paymentDate' => $row['payment_date'],
                'createdAt' => $row['created_at'],
                'images' => $images,
                'primaryImageId' => $primaryImageId
            ];
        }
    }

    // Get total bids count
    $sqlBids = "SELECT COUNT(*) as total FROM bids";
    $resultBids = $conn->query($sqlBids);
    $totalBids = $resultBids->fetch_assoc()['total'];

    sendJSON([
        'success' => true,
        'data' => [
            'products' => $products,
            'stats' => [
                'total' => count($products),
                'active' => $activeCount,
                'ended' => $endedCount,
                'total_bids' => (int)$totalBids
            ]
        ]
    ]);

} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ], 500);
} finally {
    $conn->close();
}
?>