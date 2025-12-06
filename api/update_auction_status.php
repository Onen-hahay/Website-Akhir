<?php
// api/update_auction_status.php
require_once '../config.php';

$conn = getDBConnection();

$currentTime = round(microtime(true) * 1000);

// Update status auction yang sudah berakhir
$sql = "UPDATE products SET status = 'ended' WHERE end_time <= ? AND status = 'active'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $currentTime);
$stmt->execute();

echo json_encode([
    'success' => true,
    'message' => 'Auction status updated',
    'updated' => $stmt->affected_rows
]);

$stmt->close();
$conn->close();
?>
