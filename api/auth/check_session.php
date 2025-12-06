<?php
// api/auth/check_session.php - Check if user is logged in

require_once '../../config.php';

if (isLoggedIn()) {
    sendJSON([
        'success' => true,
        'logged_in' => true,
        'data' => getCurrentUser()
    ]);
} else {
    sendJSON([
        'success' => true,
        'logged_in' => false,
        'data' => null
    ]);
}
?>