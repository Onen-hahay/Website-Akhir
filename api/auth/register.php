<?php
// api/auth/register.php - User Registration

require_once '../../config.php';

$conn = getDBConnection();

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    $username = isset($data['username']) ? sanitizeInput($data['username']) : '';
    $email = isset($data['email']) ? sanitizeInput($data['email']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    // Validation
    if (empty($username) || empty($email) || empty($password)) {
        sendJSON([
            'success' => false,
            'message' => 'All fields are required'
        ], 400);
    }

    if (strlen($username) < 3) {
        sendJSON([
            'success' => false,
            'message' => 'Username must be at least 3 characters'
        ], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJSON([
            'success' => false,
            'message' => 'Invalid email format'
        ], 400);
    }

    if (strlen($password) < 6) {
        sendJSON([
            'success' => false,
            'message' => 'Password must be at least 6 characters'
        ], 400);
    }

    // Check if username exists
    $sql = "SELECT id FROM users WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        sendJSON([
            'success' => false,
            'message' => 'Username already exists'
        ], 400);
    }

    // Check if email exists
    $sql = "SELECT id FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        sendJSON([
            'success' => false,
            'message' => 'Email already registered'
        ], 400);
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        sendJSON([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'user_id' => $conn->insert_id,
                'username' => $username
            ]
        ]);
    } else {
        sendJSON([
            'success' => false,
            'message' => 'Registration failed'
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