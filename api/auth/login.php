<?php
// api/auth/login.php - User Login

require_once '../../config.php';

$conn = getDBConnection();

try {
    // Get POST data
    $data = json_decode(file_get_contents('php://input'), true);

    $username = isset($data['username']) ? sanitizeInput($data['username']) : '';
    $password = isset($data['password']) ? $data['password'] : '';

    // Validation
    if (empty($username) || empty($password)) {
        sendJSON([
            'success' => false,
            'message' => 'Username and password are required'
        ], 400);
    }

    // Find user by username or email
    $sql = "SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $username, $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sendJSON([
            'success' => false,
            'message' => 'Invalid username or password'
        ], 401);
    }

    $user = $result->fetch_assoc();

    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendJSON([
            'success' => false,
            'message' => 'Invalid username or password'
        ], 401);
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];

    sendJSON([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);

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