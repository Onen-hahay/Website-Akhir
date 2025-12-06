<?php
// test_connection.php - Database Connection Test

echo "<h2>Database Connection Test</h2>";

// Test 1: Check if MySQL extension is loaded
echo "<h3>1. Checking MySQL Extension:</h3>";
if (extension_loaded('mysqli')) {
    echo "✓ MySQLi extension is loaded<br>";
} else {
    echo "✗ MySQLi extension is NOT loaded<br>";
}

// Test 2: Try to connect to MySQL server (without database)
echo "<h3>2. Testing MySQL Server Connection:</h3>";
$conn = @new mysqli('localhost', 'root', '');
if ($conn->connect_error) {
    echo "✗ Cannot connect to MySQL server<br>";
    echo "Error: " . $conn->connect_error . "<br>";
} else {
    echo "✓ MySQL server connection successful<br>";
    echo "Server version: " . $conn->server_info . "<br>";

    // Test 3: Check if database exists
    echo "<h3>3. Checking if 'watch_auction' database exists:</h3>";
    $result = $conn->query("SHOW DATABASES LIKE 'watch_auction'");
    if ($result && $result->num_rows > 0) {
        echo "✓ Database 'watch_auction' exists<br>";
    } else {
        echo "✗ Database 'watch_auction' does NOT exist<br>";
        echo "<strong>Solution: You need to create the database first!</strong><br>";
        echo "Run the database.sql file through phpMyAdmin or create it manually.<br>";
    }
    $conn->close();
}

// Test 4: Try to connect with the database name
echo "<h3>4. Testing Connection to 'watch_auction' Database:</h3>";
$conn2 = @new mysqli('localhost', 'root', '', 'watch_auction');
if ($conn2->connect_error) {
    echo "✗ Cannot connect to 'watch_auction' database<br>";
    echo "Error: " . $conn2->connect_error . "<br>";
    echo "<br><strong>Error Code: " . $conn2->connect_errno . "</strong><br>";

    if ($conn2->connect_errno == 1049) {
        echo "<h3 style='color: red;'>DATABASE DOES NOT EXIST!</h3>";
        echo "<p>Please follow these steps:</p>";
        echo "<ol>";
        echo "<li>Go to <a href='http://localhost/phpmyadmin' target='_blank'>phpMyAdmin</a></li>";
        echo "<li>Click on 'Import' tab</li>";
        echo "<li>Choose the file: c:\\xampp\\htdocs\\Website-Akhir\\database.sql</li>";
        echo "<li>Click 'Go' to import</li>";
        echo "</ol>";
    }
} else {
    echo "✓ Successfully connected to 'watch_auction' database<br>";

    // Test 5: Check if tables exist
    echo "<h3>5. Checking Database Tables:</h3>";
    $tables = ['users', 'products', 'bids'];
    foreach ($tables as $table) {
        $result = $conn2->query("SHOW TABLES LIKE '$table'");
        if ($result && $result->num_rows > 0) {
            echo "✓ Table '$table' exists<br>";
        } else {
            echo "✗ Table '$table' does NOT exist<br>";
        }
    }

    $conn2->close();
}

echo "<hr>";
echo "<h3>Configuration Details:</h3>";
echo "Host: localhost<br>";
echo "User: root<br>";
echo "Password: (empty)<br>";
echo "Database: watch_auction<br>";
?>
