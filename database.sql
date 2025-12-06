-- ============================================
-- Watch Auction Database Setup
-- ============================================
-- Database untuk sistem lelang jam tangan
-- Dibuat: 2025-12-07
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS `watch_auction`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `watch_auction`;

-- ============================================
-- Table: users
-- ============================================
-- Menyimpan data pengguna (admin dan user biasa)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: products
-- ============================================
-- Menyimpan data produk jam yang dilelang
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `start_price` decimal(10,2) NOT NULL,
  `current_price` decimal(10,2) NOT NULL,
  `bid_increment` decimal(10,2) NOT NULL,
  `duration` bigint(20) NOT NULL COMMENT 'Duration in milliseconds',
  `start_time` bigint(20) NOT NULL COMMENT 'Unix timestamp in milliseconds',
  `end_time` bigint(20) NOT NULL COMMENT 'Unix timestamp in milliseconds',
  `highest_bidder` varchar(50) DEFAULT NULL,
  `status` enum('active','ended') DEFAULT 'active',
  `payment_status` enum('pending','paid') DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_end_time` (`end_time`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_products_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: product_images
-- ============================================
-- Menyimpan gambar produk sebagai BLOB
DROP TABLE IF EXISTS `product_images`;
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `image_data` longblob NOT NULL COMMENT 'Binary image data',
  `image_type` varchar(50) NOT NULL COMMENT 'MIME type (image/jpeg, image/png, etc)',
  `image_size` int(11) NOT NULL COMMENT 'File size in bytes',
  `is_primary` tinyint(1) DEFAULT 0 COMMENT '1 if primary image, 0 otherwise',
  `display_order` int(11) DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_is_primary` (`is_primary`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: bids
-- ============================================
-- Menyimpan riwayat bid untuk setiap produk
DROP TABLE IF EXISTS `bids`;
CREATE TABLE `bids` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `bidder_name` varchar(50) NOT NULL,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_time` bigint(20) NOT NULL COMMENT 'Unix timestamp in milliseconds',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_bidder_name` (`bidder_name`),
  KEY `idx_bid_time` (`bid_time`),
  CONSTRAINT `fk_bids_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: payments
-- ============================================
-- Menyimpan data pembayaran untuk lelang yang dimenangkan
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL COMMENT 'e.g., credit_card, paypal, bank_transfer',
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_product_payment` (`product_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_payment_status` (`payment_status`),
  CONSTRAINT `fk_payments_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: reviews
-- ============================================
-- Menyimpan review produk (optional, untuk fitur review)
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(1) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product_review` (`product_id`, `user_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Data
-- ============================================

-- Insert default admin user
-- Username: admin
-- Password: admin123 (hashed dengan bcrypt)
INSERT INTO `users` (`username`, `email`, `password`, `role`) VALUES
('admin', 'admin@watchauction.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Note: Password hash di atas adalah untuk 'admin123'
-- Untuk keamanan, sebaiknya diganti setelah login pertama kali

-- Insert sample regular user
-- Username: testuser
-- Password: test123
INSERT INTO `users` (`username`, `email`, `password`, `role`) VALUES
('testuser', 'test@example.com', '$2y$10$E4k7dJXXHfFJt5n3lGVXLeL5WzQh5qQKzqyFPDg5pR7/.QMmBKhOq', 'user');

-- ============================================
-- MySQL Configuration Notes
-- ============================================
-- Untuk upload gambar BLOB yang besar, pastikan konfigurasi MySQL:
--
-- Tambahkan di file my.ini atau my.cnf:
-- max_allowed_packet=64M
--
-- Lokasi file (Windows XAMPP): C:\xampp\mysql\bin\my.ini
-- Lokasi file (Linux): /etc/mysql/my.cnf
--
-- Setelah edit, restart MySQL service
-- ============================================

-- ============================================
-- Database Setup Complete!
-- ============================================
-- Untuk menggunakan database ini:
-- 1. Buka phpMyAdmin atau MySQL command line
-- 2. Import file ini: mysql -u root -p < database.sql
-- 3. Atau copy-paste isi file ini ke phpMyAdmin > SQL tab
--
-- Default Login:
-- Admin - username: admin, password: admin123
-- User  - username: testuser, password: test123
-- ============================================
