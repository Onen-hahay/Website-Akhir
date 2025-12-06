-- ============================================
-- Watch Auction System - Complete Database Setup  
-- ============================================

CREATE DATABASE IF NOT EXISTS watch_auction DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE watch_auction;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT(11) NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  start_price DECIMAL(10, 2) NOT NULL,
  bid_increment DECIMAL(10, 2) NOT NULL,
  duration INT(11) NOT NULL,
  start_time BIGINT(20) NOT NULL,
  end_time BIGINT(20) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  highest_bidder VARCHAR(50) NULL,
  status ENUM('active', 'ended') DEFAULT 'active',
  payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
  payment_method VARCHAR(50) NULL,
  payment_date TIMESTAMP NULL,
  created_by INT(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Product images table (BLOB storage)
CREATE TABLE IF NOT EXISTS product_images (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  image_data LONGBLOB NOT NULL,
  image_type VARCHAR(50) NOT NULL,
  image_size INT(11) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  display_order INT(11) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  user_id INT(11) NOT NULL,
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_time BIGINT(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table  
CREATE TABLE IF NOT EXISTS payments (
  id INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  user_id INT(11) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100) NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin (Password: admin123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@auction.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

SELECT 'Database setup completed!' AS message;
