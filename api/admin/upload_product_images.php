<?php
// api/admin/upload_product_images.php - Upload multiple product images (BLOB storage)

require_once '../../config.php';

// Require admin access
requireAdmin();

header('Content-Type: application/json');

$conn = getDBConnection();

try {
    // Check if files were uploaded
    if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
        sendJSON([
            'success' => false,
            'message' => 'No images uploaded'
        ], 400);
    }

    // Check if product_id is provided
    if (!isset($_POST['product_id'])) {
        sendJSON([
            'success' => false,
            'message' => 'Product ID is required'
        ], 400);
    }

    $productId = (int)$_POST['product_id'];

    $uploadedImages = [];
    $errors = [];

    // Allowed file types
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $maxFileSize = 5 * 1024 * 1024; // 5MB (requires max_allowed_packet=64M in MySQL config)

    // Process each uploaded file
    $fileCount = count($_FILES['images']['name']);

    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = $_FILES['images']['name'][$i];
        $fileTmpName = $_FILES['images']['tmp_name'][$i];
        $fileSize = $_FILES['images']['size'][$i];
        $fileError = $_FILES['images']['error'][$i];
        $fileType = $_FILES['images']['type'][$i];

        // Skip if no file
        if ($fileError === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        // Check for upload errors
        if ($fileError !== UPLOAD_ERR_OK) {
            $errors[] = "Error uploading $fileName";
            continue;
        }

        // Validate file type
        if (!in_array($fileType, $allowedTypes)) {
            $errors[] = "$fileName: Invalid file type. Only JPG, PNG, GIF, WEBP allowed";
            continue;
        }

        // Validate file size
        if ($fileSize > $maxFileSize) {
            $maxSizeMB = round($maxFileSize / 1024 / 1024, 1);
            $fileSizeMB = round($fileSize / 1024 / 1024, 2);
            $errors[] = "$fileName: File too large ({$fileSizeMB}MB). Maximum {$maxSizeMB}MB";
            continue;
        }

        // Read image file into binary data
        $imageData = file_get_contents($fileTmpName);

        if ($imageData === false) {
            $errors[] = "$fileName: Failed to read file";
            continue;
        }

        // Set primary flag (first image is primary)
        $isPrimary = ($i === 0) ? 1 : 0;
        $displayOrder = $i;

        // Insert into database
        $stmt = $conn->prepare("INSERT INTO product_images (product_id, image_data, image_type, image_size, is_primary, display_order) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issiii", $productId, $imageData, $fileType, $fileSize, $isPrimary, $displayOrder);

        if ($stmt->execute()) {
            $imageId = $conn->insert_id;
            $uploadedImages[] = [
                'id' => $imageId,
                'original_name' => $fileName,
                'type' => $fileType,
                'size' => $fileSize,
                'is_primary' => $isPrimary,
                'display_order' => $displayOrder
            ];
        } else {
            $errors[] = "$fileName: Failed to save to database";
        }

        $stmt->close();
    }

    // Return result
    if (empty($uploadedImages) && !empty($errors)) {
        sendJSON([
            'success' => false,
            'message' => 'Failed to upload images',
            'errors' => $errors
        ], 400);
    }

    sendJSON([
        'success' => true,
        'message' => count($uploadedImages) . ' image(s) uploaded successfully',
        'data' => $uploadedImages,
        'errors' => $errors
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
