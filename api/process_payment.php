<?php
// api/process_payment.php - Process payment for won auction

require_once '../config.php';

// Require user to be logged in
requireLogin();

header('Content-Type: application/json');

$conn = getDBConnection();

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['product_id']) || !isset($input['payment_method']) || !isset($input['amount'])) {
        sendJSON([
            'success' => false,
            'message' => 'Missing required fields'
        ], 400);
    }

    $productId = (int)$input['product_id'];
    $paymentMethod = $input['payment_method'];
    $amount = (float)$input['amount'];
    $userId = $_SESSION['user_id'];
    $username = $_SESSION['username'];

    // Verify that the user won this auction
    $stmt = $conn->prepare("SELECT id, highest_bidder, current_price, status, payment_status FROM products WHERE id = ?");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJSON([
            'success' => false,
            'message' => 'Product not found'
        ], 404);
    }

    $product = $result->fetch_assoc();
    $stmt->close();

    // Check if user is the winner (highest_bidder stores username, not user_id)
    if ($product['highest_bidder'] != $username) {
        sendJSON([
            'success' => false,
            'message' => 'You did not win this auction'
        ], 403);
    }

    // Check if auction has ended
    if ($product['status'] !== 'ended') {
        sendJSON([
            'success' => false,
            'message' => 'Auction is still active'
        ], 400);
    }

    // Check if already paid
    if ($product['payment_status'] === 'paid') {
        sendJSON([
            'success' => false,
            'message' => 'This item has already been paid for'
        ], 400);
    }

    // Verify amount matches
    if (abs($amount - $product['current_price']) > 0.01) {
        sendJSON([
            'success' => false,
            'message' => 'Payment amount does not match winning bid'
        ], 400);
    }

    // Generate transaction ID
    $transactionId = 'TXN-' . strtoupper(uniqid());

    // Start transaction
    $conn->begin_transaction();

    try {
        // Insert payment record
        $stmt = $conn->prepare("INSERT INTO payments (product_id, user_id, amount, payment_method, payment_status, transaction_id, payment_date) VALUES (?, ?, ?, ?, 'completed', ?, NOW())");
        $stmt->bind_param("iidss", $productId, $userId, $amount, $paymentMethod, $transactionId);
        $stmt->execute();
        $paymentId = $conn->insert_id;
        $stmt->close();

        // Update product payment status
        $stmt = $conn->prepare("UPDATE products SET payment_status = 'paid', payment_method = ?, payment_date = NOW() WHERE id = ?");
        $stmt->bind_param("si", $paymentMethod, $productId);
        $stmt->execute();
        $stmt->close();

        // Commit transaction
        $conn->commit();

        sendJSON([
            'success' => true,
            'message' => 'Payment processed successfully',
            'data' => [
                'payment_id' => $paymentId,
                'transaction_id' => $transactionId,
                'amount' => $amount,
                'payment_method' => $paymentMethod
            ]
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'message' => 'Payment processing failed: ' . $e->getMessage()
    ], 500);
} finally {
    $conn->close();
}
?>
