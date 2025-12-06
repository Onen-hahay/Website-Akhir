# Watch Auction System

A complete real-time online auction platform for luxury watches with bidding, payment processing, and admin management features.

## 📋 Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Data Flow Diagram](#data-flow-diagram)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)

## ✨ Features

### User Features
- **User Authentication**: Register, login, and session management
- **Real-time Bidding**: Place bids on active auctions with automatic price updates
- **My Bidding Dashboard**:
  - View bid history (completed auctions)
  - Track running bids (active auctions)
  - See won products with payment status
  - User profile with statistics
- **Payment System**: Multiple payment methods (Bank Transfer, Credit Card, PayPal, Cryptocurrency)
- **Product Gallery**: Multi-image BLOB storage with thumbnail gallery
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Product Management**: Add, edit, delete auction products
- **Multi-Image Upload**: Upload up to 5 images per product (stored as BLOB)
- **Auction Monitoring**: View all products with status, bidders, and payment tracking
- **Payment Status Tracking**: Monitor pending/paid/cancelled payments
- **Filter & Search**: Filter products by status and date range

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT SIDE                             │
├─────────────────────────────────────────────────────────────┤
│  index.html          │  Main auction listing page           │
│  auth.html           │  Login/Registration                  │
│  mybid.html          │  User bidding dashboard              │
│  payment.html        │  Payment processing page             │
│  admin/dashboard.html│  Admin product management            │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (PHP)                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication APIs                                         │
│  ├─ login.php                                               │
│  └─ register.php                                            │
│                                                              │
│  Product APIs                                               │
│  ├─ get_products.php                                        │
│  ├─ get_product.php                                         │
│  └─ get_image.php (BLOB retrieval)                          │
│                                                              │
│  Bidding APIs                                               │
│  ├─ place_bid.php                                           │
│  └─ get_bids.php                                            │
│                                                              │
│  User APIs                                                  │
│  ├─ get_bid_history.php                                     │
│  ├─ get_running_bids.php                                    │
│  ├─ get_won_products.php                                    │
│  └─ get_profile.php                                         │
│                                                              │
│  Payment APIs                                               │
│  └─ process_payment.php                                     │
│                                                              │
│  Admin APIs                                                 │
│  ├─ add_product.php                                         │
│  ├─ update_product.php                                      │
│  ├─ delete_product.php                                      │
│  ├─ upload_product_images.php                               │
│  └─ get_all_products.php                                    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                          │
├─────────────────────────────────────────────────────────────┤
│  users              │  User accounts & authentication       │
│  products           │  Auction products with payment status │
│  product_images     │  BLOB image storage                   │
│  bids               │  Bid records & history                │
│  payments           │  Payment transactions                 │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow Diagram

### Level 0 - Context Diagram
```
                    ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    Register/Login    Place Bids         Make Payment
        │                  │                  │
        ▼                  ▼                  ▼
┌────────────────────────────────────────────────┐
│         Watch Auction System                   │
│  - Authentication                              │
│  - Bidding Engine                              │
│  - Payment Processing                          │
│  - Product Management                          │
└────────────────────────────────────────────────┘
        │                  │                  │
    User Data        Bid Updates         Payment Status
        │                  │                  │
        ▼                  ▼                  ▼
    ┌──────────────────────────────────────────┐
    │         Database (MySQL)                 │
    │  - users, products, bids, payments       │
    └──────────────────────────────────────────┘
```

### Level 1 - Main Processes

```
┌──────────┐
│   USER   │
└────┬─────┘
     │
     │ 1. Login/Register
     ▼
┌─────────────────┐
│  1.0 Auth       │──────► [users table]
│  Process        │
└─────────────────┘
     │
     │ Session Token
     ▼
┌─────────────────┐
│  2.0 Browse     │◄────── [products table]
│  Products       │◄────── [product_images table]
└─────────────────┘
     │
     │ 3. Select Product
     ▼
┌─────────────────┐
│  3.0 Place      │──────► [bids table]
│  Bid            │──────► [products table] (update current_price)
└─────────────────┘
     │
     │ 4. Auction Ends (User Wins)
     ▼
┌─────────────────┐
│  4.0 Process    │──────► [payments table]
│  Payment        │──────► [products table] (update payment_status)
└─────────────────┘
     │
     │ Payment Confirmation
     ▼
┌──────────┐
│   USER   │
└──────────┘


┌──────────┐
│  ADMIN   │
└────┬─────┘
     │
     │ 5. Add/Edit Product
     ▼
┌─────────────────┐
│  5.0 Manage     │──────► [products table]
│  Products       │──────► [product_images table] (BLOB)
└─────────────────┘
     │
     │ 6. Monitor
     ▼
┌─────────────────┐
│  6.0 View       │◄────── [products, bids, payments]
│  Dashboard      │        (joined data)
└─────────────────┘
```

### Level 2 - Bidding Process Detail

```
┌──────────┐
│   USER   │
└────┬─────┘
     │
     │ Select Product
     ▼
┌─────────────────────┐
│ 3.1 Validate Bid    │
│ - Check amount      │◄─── [products table]
│ - Check increment   │     (get current_price, bid_increment)
│ - Verify auth       │
└──────┬──────────────┘
       │
       │ Valid Bid
       ▼
┌─────────────────────┐
│ 3.2 Record Bid      │
│ - Insert bid record │────► [bids table]
│ - Get user info     │◄─── [users table]
└──────┬──────────────┘
       │
       │ Bid Recorded
       ▼
┌─────────────────────┐
│ 3.3 Update Product  │
│ - Set current_price │────► [products table]
│ - Set highest_bidder│      (UPDATE current_price, highest_bidder)
└──────┬──────────────┘
       │
       │ Success Response
       ▼
┌──────────┐
│   USER   │
└──────────┘
```

### Level 2 - Payment Process Detail

```
┌──────────┐
│   USER   │
└────┬─────┘
     │
     │ Click "Pay Now"
     ▼
┌─────────────────────┐
│ 4.1 Verify Winner   │
│ - Check user is     │◄─── [products table]
│   highest_bidder    │     (WHERE highest_bidder = username)
│ - Check ended       │
└──────┬──────────────┘
       │
       │ Winner Verified
       ▼
┌─────────────────────┐
│ 4.2 Select Payment  │
│ - Bank Transfer     │
│ - Credit Card       │
│ - PayPal            │
│ - Cryptocurrency    │
└──────┬──────────────┘
       │
       │ Payment Method Selected
       ▼
┌─────────────────────┐
│ 4.3 Process Payment │
│ - Generate TXN ID   │────► [payments table]
│ - Create record     │      (INSERT payment record)
└──────┬──────────────┘
       │
       │ Payment Processed
       ▼
┌─────────────────────┐
│ 4.4 Update Status   │────► [products table]
│ - Set payment_status│      (UPDATE payment_status = 'paid')
│   = 'paid'          │
│ - Set payment_date  │
└──────┬──────────────┘
       │
       │ Redirect to Home
       ▼
┌──────────┐
│   USER   │
└──────────┘
```

## 🗄 Database Schema

### users
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: 'user', 'admin')
- created_at (TIMESTAMP)
```

### products
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR)
- description (TEXT)
- start_price (DECIMAL)
- bid_increment (DECIMAL)
- duration (INT, milliseconds)
- start_time (BIGINT, Unix timestamp)
- end_time (BIGINT, Unix timestamp)
- current_price (DECIMAL)
- highest_bidder (VARCHAR, username)
- status (ENUM: 'active', 'ended')
- payment_status (ENUM: 'pending', 'paid', 'cancelled')
- payment_method (VARCHAR)
- payment_date (TIMESTAMP)
- created_by (INT, FOREIGN KEY → users.id)
- created_at (TIMESTAMP)
```

### product_images (BLOB Storage)
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- product_id (INT, FOREIGN KEY → products.id, CASCADE DELETE)
- image_data (LONGBLOB, binary image data)
- image_type (VARCHAR, MIME type)
- image_size (INT, bytes)
- is_primary (TINYINT, 0 or 1)
- display_order (INT)
- created_at (TIMESTAMP)
```

### bids
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- product_id (INT, FOREIGN KEY → products.id, CASCADE DELETE)
- user_id (INT, FOREIGN KEY → users.id, CASCADE DELETE)
- bid_amount (DECIMAL)
- bid_time (BIGINT, Unix timestamp)
- created_at (TIMESTAMP)
```

### payments
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- product_id (INT, FOREIGN KEY → products.id, CASCADE DELETE)
- user_id (INT, FOREIGN KEY → users.id, CASCADE DELETE)
- amount (DECIMAL)
- payment_method (VARCHAR)
- payment_status (ENUM: 'pending', 'completed', 'failed', 'refunded')
- transaction_id (VARCHAR, unique transaction ID)
- payment_date (TIMESTAMP)
- notes (TEXT)
```

## 🚀 Installation

### Prerequisites
- XAMPP (Apache + MySQL + PHP 7.4+)
- Web browser (Chrome, Firefox, Edge)

### Setup Steps

1. **Clone/Download the project**
   ```bash
   # Place the project in XAMPP htdocs folder
   C:\xampp\htdocs\Website-Akhir\
   ```

2. **Configure MySQL**
   - Edit `C:\xampp\mysql\bin\my.ini`
   - Add under `[mysqld]` section:
     ```ini
     max_allowed_packet=64M
     ```
   - Restart MySQL from XAMPP Control Panel

3. **Create Database**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Create new database: `watch_auction`
   - Import `database.sql` file

4. **Configure Database Connection**
   - Edit `config.php`
   - Update database credentials if needed:
     ```php
     $host = 'localhost';
     $dbname = 'watch_auction';
     $username = 'root';
     $password = '';
     ```

5. **Start Services**
   - Start Apache and MySQL from XAMPP Control Panel

6. **Access the Application**
   - Main site: http://localhost/Website-Akhir/
   - Admin panel: http://localhost/Website-Akhir/admin/dashboard.html

### Default Admin Account
```
Username: admin
Password: admin123
```

### Create Regular User Account
- Go to http://localhost/Website-Akhir/auth.html
- Click "Sign Up" and create an account

## 📖 Usage

### For Users

1. **Register/Login**
   - Navigate to the authentication page
   - Create an account or login with existing credentials

2. **Browse Products**
   - View all available watch auctions on the homepage
   - Click on product images to view full gallery
   - See current price, time remaining, and highest bidder

3. **Place Bids**
   - Enter bid amount (must meet minimum increment)
   - Click "Place Bid"
   - Track your bids in "My Bidding" sidebar

4. **Monitor Your Bids**
   - **History Tab**: View all completed auctions
   - **Running Tab**: Track active bids and status (highest/outbid)
   - **Won Tab**: See products you've won
   - **Profile Tab**: View your statistics

5. **Make Payment**
   - For won auctions, click "Pay Now" button
   - Select payment method
   - Complete payment
   - Status updates to "PAID"

### For Admins

1. **Login to Admin Panel**
   - Navigate to `/admin/dashboard.html`
   - Login with admin credentials

2. **Add New Product**
   - Click "+ Add New Product"
   - Fill in product details:
     - Name, description
     - Start price
     - Bid increment
     - Duration
   - Upload up to 5 images
   - Click "Publish Product"

3. **Manage Products**
   - View all products in table format
   - Filter by status (All/Active/Ended)
   - Filter by date range
   - Edit or Delete products
   - Monitor payment status

4. **Track Statistics**
   - View total products
   - Active vs Ended auctions
   - Total bids across all products

## 🔌 API Documentation

### Authentication

#### POST `/api/login.php`
**Request:**
```json
{
  "username": "user123",
  "password": "password"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "user123",
    "role": "user"
  }
}
```

#### POST `/api/register.php`
**Request:**
```json
{
  "username": "newuser",
  "email": "user@email.com",
  "password": "password"
}
```

### Products

#### GET `/api/get_products.php`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rolex Submariner",
      "currentPrice": 15000,
      "endTime": 1735689600000,
      "images": [1, 2, 3],
      "primaryImageId": 1
    }
  ]
}
```

#### GET `/api/get_image.php?id=1`
Returns binary image data with proper Content-Type header

### Bidding

#### POST `/api/place_bid.php`
**Request:**
```json
{
  "product_id": 1,
  "bid_amount": 15500
}
```

### Payment

#### POST `/api/process_payment.php`
**Request:**
```json
{
  "product_id": 1,
  "payment_method": "bank_transfer",
  "amount": 15500
}
```
**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "payment_id": 1,
    "transaction_id": "TXN-ABC123"
  }
}
```

## 🛠 Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 7.4+
- **Database**: MySQL 8.0
- **Server**: Apache (XAMPP)
- **Image Storage**: MySQL LONGBLOB

## 📝 Key Features Implementation

### 1. BLOB Image Storage
Images are stored directly in the database as binary data:
- Reduces filesystem dependency
- Easier backup and migration
- Automatic cleanup with CASCADE DELETE

### 2. Real-time Bidding
- Automatic price updates
- Highest bidder tracking
- Bid validation (increment checking)

### 3. Payment System
- Multi-method support
- Transaction ID generation
- Status tracking (pending/paid/cancelled)
- Winner verification

### 4. Session Management
- Secure PHP sessions
- Role-based access control (User/Admin)
- Auto-logout on session expiry

## 🔒 Security Features

- Password hashing (bcrypt)
- SQL injection prevention (prepared statements)
- XSS protection (input sanitization)
- Session-based authentication
- Admin-only route protection

## 📄 License

This project is created for educational purposes.

## 👥 Credits

Developed as a complete auction platform demonstration project.

---

For issues or questions, please check the code comments or contact the development team.
