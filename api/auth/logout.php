<?php
// api/auth/logout.php - User Logout

require_once '../../config.php';

// Destroy session
session_unset();
session_destroy();

sendJSON([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>