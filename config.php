<?php
// config.php - Koneksi Database & Session

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set header untuk JSON dan CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Konfigurasi Database
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // Password default XAMPP kosong
define('DB_NAME', 'watch_auction');

// Fungsi untuk membuat koneksi database
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Set charset ke UTF-8
    $conn->set_charset("utf8mb4");
    
    // Cek koneksi
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    
    return $conn;
}

// Fungsi untuk mengirim response JSON
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Fungsi untuk validasi input
function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

// Fungsi untuk cek apakah user sudah login
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Fungsi untuk cek apakah user adalah admin
function isAdmin() {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
}

// Fungsi untuk get current user
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role']
    ];
}

// Fungsi untuk require login
function requireLogin() {
    if (!isLoggedIn()) {
        sendJSON([
            'success' => false,
            'message' => 'Authentication required',
            'redirect' => '/Website-Akhir/login.html'
        ], 401);
    }
}

// Fungsi untuk require admin
function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        sendJSON([
            'success' => false,
            'message' => 'Admin access required'
        ], 403);
    }
}
?>