<?php
// api/get_image.php - Retrieve and serve images from database BLOB

require_once '../config.php';

$conn = getDBConnection();

try {
    // Check if image ID is provided
    if (!isset($_GET['id']) || empty($_GET['id'])) {
        http_response_code(400);
        die('Image ID is required');
    }

    $imageId = (int)$_GET['id'];

    // Retrieve image from database
    $stmt = $conn->prepare("SELECT image_data, image_type FROM product_images WHERE id = ?");
    $stmt->bind_param("i", $imageId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        die('Image not found');
    }

    $row = $result->fetch_assoc();
    $imageData = $row['image_data'];
    $imageType = $row['image_type'];

    // Set appropriate headers
    header("Content-Type: " . $imageType);
    header("Content-Length: " . strlen($imageData));
    header("Cache-Control: public, max-age=31536000"); // Cache for 1 year

    // Output the image
    echo $imageData;

    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    die('Error retrieving image: ' . $e->getMessage());
} finally {
    $conn->close();
}
?>
