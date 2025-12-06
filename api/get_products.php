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
        $productId = (int)$row['id'];

        // Get product images (now returns image IDs for BLOB retrieval)
        $imgSql = "SELECT id, is_primary, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC";
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
            'status' => $row['status'],
            'images' => $images,
            'primaryImageId' => $primaryImageId
        ];
    }
}

echo json_encode([
    'success' => true,
    'data' => $products
]);

$conn->close();
?>