<?php
// api/admin/delete_product.php - Delete product (Admin only)

require_once '../../config.php';

// Require admin access
requireAdmin();

$conn = getDBConnection();

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);
    $productId = isset($data['product_id']) ? (int)$data['product_id'] : 0;

    // Validation
    if ($productId <= 0) {
        sendJSON([
            'success' => false,
            'message' => 'Invalid product ID'
        ], 400);
    }

    // Check if product exists
    $sql = "SELECT id FROM products WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJSON([
            'success' => false,
            'message' => 'Product not found'
        ], 404);
    }

    // Delete product (bids will be deleted automatically due to CASCADE)
    $sql = "DELETE FROM products WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $productId);

    if ($stmt->execute()) {
        sendJSON([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Failed to delete product'
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