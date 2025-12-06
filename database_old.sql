-- Database Setup for Watch Auction System
-- Created: 2025-12-06

-- Create database
CREATE DATABASE IF NOT EXISTS `watch_auction` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `watch_auction`;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: products
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `start_price` DECIMAL(10, 2) NOT NULL,
  `current_price` DECIMAL(10, 2) NOT NULL,
  `bid_increment` DECIMAL(10, 2) NOT NULL,
  `duration` INT(11) NOT NULL COMMENT 'Duration in milliseconds',
  `start_time` BIGINT(20) NOT NULL COMMENT 'Start time in milliseconds',
  `end_time` BIGINT(20) NOT NULL COMMENT 'End time in milliseconds',
  `highest_bidder` VARCHAR(50) DEFAULT NULL,
  `created_by` INT(11) NOT NULL,
  `status` ENUM('active', 'ended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_end_time` (`end_time`),
  INDEX `idx_created_by` (`created_by`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: bids
CREATE TABLE IF NOT EXISTS `bids` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `product_id` INT(11) NOT NULL,
  `bidder_name` VARCHAR(50) NOT NULL,
  `bid_amount` DECIMAL(10, 2) NOT NULL,
  `bid_time` BIGINT(20) NOT NULL COMMENT 'Bid time in milliseconds',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_bidder_name` (`bidder_name`),
  INDEX `idx_bid_time` (`bid_time`),
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
-- Password: admin123 (hashed using password_hash with bcrypt)
INSERT INTO `users` (`username`, `email`, `password`, `role`) VALUES
('admin', 'admin@watchauction.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Insert sample regular user
-- Password: user123
INSERT INTO `users` (`username`, `email`, `password`, `role`) VALUES
('testuser', 'user@watchauction.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Sample product (optional - remove if not needed)
-- INSERT INTO `products` (`name`, `description`, `start_price`, `current_price`, `bid_increment`, `duration`, `start_time`, `end_time`, `created_by`, `status`) VALUES
-- ('Rolex Submariner', 'Classic luxury dive watch in excellent condition', 5000.00, 5000.00, 100.00, 3600000, UNIX_TIMESTAMP(NOW()) * 1000, (UNIX_TIMESTAMP(NOW()) + 3600) * 1000, 1, 'active');

-- Display success message
SELECT 'Database setup completed successfully!' AS message;
