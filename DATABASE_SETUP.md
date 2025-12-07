# Database Setup Guide - Watch Auction System

## 📋 Cara Setup Database

### Method 1: Menggunakan phpMyAdmin (Recommended)

1. **Buka phpMyAdmin**
   - Akses: `http://localhost/phpmyadmin`

2. **Import Database**
   - Klik tab "**SQL**" di menu atas
   - Copy semua isi file `database.sql`
   - Paste ke text area
   - Klik tombol "**Go**" atau "**Kirim**"

3. **Verifikasi**
   - Database `watch_auction` seharusnya sudah terbuat
   - Cek apakah ada 6 tabel: `users`, `products`, `product_images`, `bids`, `payments`, `reviews`

### Method 2: Menggunakan MySQL Command Line

```bash
# Masuk ke direktori project
cd c:\xampp\htdocs\Website-Akhir

# Import database
mysql -u root -p < database.sql

# Tekan Enter (password kosong untuk XAMPP default)
```

---

## 🔑 Default User Credentials

Setelah database diimport, gunakan kredensial berikut untuk login:

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@watchauction.com`
- **Role:** Admin (bisa menambah produk, melihat dashboard admin)

### Test User Account
- **Username:** `testuser`
- **Password:** `test123`
- **Email:** `test@example.com`
- **Role:** User biasa (bisa bid pada lelang)

> ⚠️ **PENTING:** Ganti password admin setelah login pertama kali untuk keamanan!

---

## 🗂️ Struktur Database

### 1. Table: `users`
Menyimpan data pengguna (admin dan user)
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password (bcrypt)
- `role` - 'admin' atau 'user'
- `created_at` - Timestamp pembuatan

### 2. Table: `products`
Menyimpan data produk jam yang dilelang
- `id` - Primary key
- `name` - Nama produk
- `description` - Deskripsi produk
- `start_price` - Harga awal
- `current_price` - Harga saat ini (tertinggi)
- `bid_increment` - Kelipatan bid minimum
- `duration` - Durasi lelang (milliseconds)
- `start_time` - Waktu mulai (unix timestamp ms)
- `end_time` - Waktu berakhir (unix timestamp ms)
- `highest_bidder` - Username pemenang saat ini
- `status` - 'active' atau 'ended'
- `payment_status` - 'pending' atau 'paid'
- `payment_method` - Metode pembayaran
- `payment_date` - Tanggal pembayaran
- `created_by` - User ID yang membuat (admin)

### 3. Table: `product_images`
Menyimpan gambar produk sebagai BLOB
- `id` - Primary key
- `product_id` - Foreign key ke products
- `image_data` - Binary image data (LONGBLOB)
- `image_type` - MIME type (image/jpeg, image/png, dll)
- `image_size` - Ukuran file (bytes)
- `is_primary` - 1 jika gambar utama
- `display_order` - Urutan tampilan

### 4. Table: `bids`
Menyimpan riwayat bid
- `id` - Primary key
- `product_id` - Foreign key ke products
- `bidder_name` - Username pembid
- `bid_amount` - Jumlah bid
- `bid_time` - Waktu bid (unix timestamp ms)

### 5. Table: `payments`
Menyimpan data pembayaran
- `id` - Primary key
- `product_id` - Foreign key ke products
- `user_id` - Foreign key ke users
- `amount` - Jumlah pembayaran
- `payment_method` - Metode pembayaran (credit_card, paypal, dll)
- `payment_status` - 'pending', 'completed', atau 'failed'
- `transaction_id` - ID transaksi unik
- `payment_date` - Tanggal pembayaran

### 6. Table: `reviews`
Menyimpan review produk (optional)
- `id` - Primary key
- `product_id` - Foreign key ke products
- `user_id` - Foreign key ke users
- `rating` - Rating 1-5
- `comment` - Komentar review

---

## ⚙️ Konfigurasi MySQL untuk Upload Gambar

Database ini menggunakan BLOB untuk menyimpan gambar. Untuk upload gambar besar (hingga 5MB):

### Windows (XAMPP)

1. Buka file: `C:\xampp\mysql\bin\my.ini`
2. Cari baris `max_allowed_packet`
3. Ubah menjadi:
   ```ini
   max_allowed_packet=64M
   ```
4. Restart MySQL dari XAMPP Control Panel

### Linux/Mac

1. Buka file: `/etc/mysql/my.cnf`
2. Tambahkan di section `[mysqld]`:
   ```ini
   max_allowed_packet=64M
   ```
3. Restart MySQL:
   ```bash
   sudo service mysql restart
   ```

---

## 🔍 Troubleshooting

### Error: "Failed to get all products"

**Kemungkinan penyebab:**

1. **Database belum diimport**
   - Solusi: Import file `database.sql` terlebih dahulu

2. **Nama database salah**
   - Cek di phpMyAdmin apakah database bernama `watch_auction`
   - Cek file `config.php` pastikan DB_NAME = 'watch_auction'

3. **User belum login sebagai admin**
   - Logout dan login ulang dengan kredensial admin di atas

4. **Session tidak berfungsi**
   - Restart browser
   - Clear cookies dan session
   - Login ulang

5. **MySQL tidak running**
   - Buka XAMPP Control Panel
   - Start MySQL service

### Error saat upload gambar

1. **File too large**
   - Ikuti langkah konfigurasi `max_allowed_packet` di atas
   - Restart MySQL

2. **Invalid file type**
   - Hanya support: JPG, JPEG, PNG, GIF, WEBP
   - Max size: 5MB per file

### Error koneksi database

1. **Cek kredensial di `config.php`:**
   ```php
   DB_HOST = 'localhost'
   DB_USER = 'root'
   DB_PASS = ''  // Kosong untuk XAMPP default
   DB_NAME = 'watch_auction'
   ```

2. **Test koneksi MySQL:**
   ```bash
   mysql -u root -p
   ```

---

## 📝 Testing Setup

Setelah database diimport, test dengan langkah berikut:

1. **Test Login Admin**
   - Buka: `http://localhost/Website-Akhir/login.html`
   - Login dengan: `admin` / `admin123`
   - Seharusnya redirect ke dashboard admin

2. **Test Dashboard Admin**
   - Setelah login sebagai admin
   - Buka: `http://localhost/Website-Akhir/admin.html`
   - Seharusnya bisa melihat daftar produk (kosong jika belum ada)

3. **Test Tambah Produk**
   - Klik "Add New Product" di dashboard admin
   - Isi form dan upload gambar
   - Produk seharusnya muncul di dashboard

4. **Test Login User**
   - Logout dari admin
   - Login dengan: `testuser` / `test123`
   - Buka halaman utama
   - User biasa tidak bisa akses admin panel

---

## 🔐 Security Notes

1. **Ganti password default admin** setelah setup
2. **Jangan gunakan kredensial default** di production
3. **Aktifkan HTTPS** untuk production environment
4. **Backup database** secara berkala

---

## 📞 Support

Jika masih ada error setelah mengikuti guide ini:

1. Cek browser console (F12) → Network tab
2. Lihat response dari API endpoint
3. Cek error log MySQL di phpMyAdmin
4. Pastikan semua service XAMPP running (Apache + MySQL)

---

**Last Updated:** 2025-12-07
