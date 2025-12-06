<?php
// api/admin/add_product.php - Add new product (Admin only)

require_once '../../config.php';

// Require admin access
requireAdmin();

$conn = getDBConnection();

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    $name = isset($data['name']) ? sanitizeInput($data['name']) : '';
    $description = isset($data['description']) ? sanitizeInput($data['description']) : '';
    $startPrice = isset($data['start_price']) ? (float)$data['start_price'] : 0;
    $bidIncrement = isset($data['bid_increment']) ? (float)$data['bid_increment'] : 0;
    $duration = isset($data['duration']) ? (int)$data['duration'] : 0;
    $images = isset($data['images']) ? $data['images'] : [];

    // Validation
    if (empty($name) || empty($description)) {
        sendJSON([
            'success' => false,
            'message' => 'Name and description are required'
        ], 400);
    }

    if ($startPrice <= 0) {
        sendJSON([
            'success' => false,
            'message' => 'Start price must be greater than 0'
        ], 400);
    }

    if ($bidIncrement <= 0) {
        sendJSON([
            'success' => false,
            'message' => 'Bid increment must be greater than 0'
        ], 400);
    }

    if ($duration <= 0) {
        sendJSON([
            'success' => false,
            'message' => 'Duration must be greater than 0'
        ], 400);
    }

    // Calculate start and end time
    $startTime = round(microtime(true) * 1000);
    $endTime = $startTime + $duration;
    $currentPrice = $startPrice;
    $userId = $_SESSION['user_id'];

    // Insert product
    $sql = "INSERT INTO products (name, description, start_price, bid_increment, duration, start_time, end_time, current_price, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssddiiidi", $name, $description, $startPrice, $bidIncrement, $duration, $startTime, $endTime, $currentPrice, $userId);

    if ($stmt->execute()) {
        $productId = $conn->insert_id;

        // Note: Images are now uploaded directly to database via upload_product_images.php
        // This endpoint no longer handles image insertion - images should be uploaded separately

        sendJSON([
            'success' => true,
            'message' => 'Product added successfully',
            'data' => [
                'product_id' => $productId
            ]
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Failed to add product'
        ], 500);
    }

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