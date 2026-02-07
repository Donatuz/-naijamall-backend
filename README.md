# NaijaMall Backend API

Complete backend API for NaijaMall - A marketplace connecting rural market sellers with urban buyers across Nigeria.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management for buyers, sellers, riders, and admins
- **Product Management**: Complete CRUD operations with image uploads and search functionality
- **Order Management**: End-to-end order processing with real-time tracking
- **Escrow Payment System**: Secure payment processing with Paystack integration
- **Delivery Management**: Rider assignment and delivery tracking
- **Admin Dashboard**: Complete analytics and management tools
- **File Upload**: Cloudinary integration for images
- **Security**: JWT authentication, role-based access control, rate limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Paystack account (for payments)

## 🛠️ Installation

1. **Clone and navigate to backend directory**
```bash
cd naijamall-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. **Configure environment variables**
```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/naijamall

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Paystack
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

5. **Start the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+2348137790780",
  "password": "password123",
  "role": "buyer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer {token}
```

### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer {token}
```

---

## 📦 Products

### Get All Products
```http
GET /api/products?search=tomato&category=123&minPrice=100&maxPrice=5000&sort=price_asc&page=1&limit=12
```

**Query Parameters:**
- `search` - Search in name, description, tags
- `category` - Filter by category ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `seller` - Filter by seller ID
- `isFresh` - Filter fresh products (true/false)
- `isAvailable` - Filter available products (true/false)
- `sort` - Sort by (price_asc, price_desc, rating, popular)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)

### Get Single Product
```http
GET /api/products/:id
```

### Create Product (Verified Sellers Only)
```http
POST /api/products
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Fresh Tomatoes",
  "description": "Fresh tomatoes from local farm",
  "price": 800,
  "unit": "kg",
  "category": "category_id",
  "stock": 100,
  "isFresh": true,
  "discount": 0,
  "tags": ["tomato", "vegetables", "fresh"],
  "marketLocation": {
    "name": "Mile 12 Market",
    "address": "Mile 12, Lagos",
    "state": "Lagos"
  }
}
```

### Update Product
```http
PUT /api/products/:id
Authorization: Bearer {token}
```

### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer {token}
```

### Get My Products (Sellers)
```http
GET /api/products/seller/my-products
Authorization: Bearer {token}
```

### Upload Product Images
```http
POST /api/products/:id/upload-images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data: images (max 5 files)
```

### Delete Product Image
```http
DELETE /api/products/:id/images/:publicId
Authorization: Bearer {token}
```

---

## 🛒 Orders

### Create Order (Buyers Only)
```http
POST /api/orders
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "zipCode": "100001",
    "phone": "+2348137790780"
  },
  "paymentMethod": "card",
  "buyerNotes": "Please deliver in the morning"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderNumber": "NM12345678901",
    "totalAmount": 5000,
    "escrowFee": 500,
    "marketProcurementFee": 1500,
    "deliveryFee": 1000,
    ...
  }
}
```

### Get My Orders
```http
GET /api/orders/my-orders?status=pending&page=1&limit=10
Authorization: Bearer {token}
```

### Get Single Order
```http
GET /api/orders/:id
Authorization: Bearer {token}
```

### Update Order Status
```http
PATCH /api/orders/:id/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "confirmed",
  "description": "Order confirmed by seller"
}
```

**Status Options:**
- `pending` → `confirmed` → `shopping` → `ready_for_delivery` → `out_for_delivery` → `delivered`
- `cancelled`, `refunded`

### Confirm Delivery (Buyers)
```http
POST /api/orders/:id/confirm
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "feedback": "Great service, fresh products!"
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

---

## 💳 Payments

### Initialize Payment
```http
POST /api/payments/initialize
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentReference": "PAY-1234567890-1234",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "access_code"
  }
}
```

### Verify Payment
```http
GET /api/payments/verify/:reference
```

### Get Payment Details
```http
GET /api/payments/:id
Authorization: Bearer {token}
```

### Get My Payments
```http
GET /api/payments/my-payments
Authorization: Bearer {token}
```

### Release Escrow (Admin)
```http
POST /api/payments/:id/release-escrow
Authorization: Bearer {token}
```

### Refund Payment (Admin)
```http
POST /api/payments/:id/refund
Authorization: Bearer {token}
```

---

## 🚚 Delivery (Riders)

### Get Available Deliveries
```http
GET /api/deliveries/available
Authorization: Bearer {token}
```

### Get My Deliveries
```http
GET /api/deliveries/my-deliveries?status=assigned
Authorization: Bearer {token}
```

### Accept Delivery
```http
POST /api/deliveries/:orderId/accept
Authorization: Bearer {token}
```

### Update Delivery Status
```http
PATCH /api/deliveries/:orderId/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "picked_up",
  "location": "Mile 12 Market, Lagos",
  "notes": "Items picked up successfully"
}
```

**Status Options:** `picked_up`, `in_transit`, `delivered`

### Get Rider Statistics
```http
GET /api/deliveries/stats
Authorization: Bearer {token}
```

---

## 🏷️ Categories

### Get All Categories
```http
GET /api/categories
```

### Get Single Category
```http
GET /api/categories/:id
```

### Create Category (Admin)
```http
POST /api/categories
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Vegetables",
  "description": "Fresh vegetables",
  "icon": "🥬",
  "order": 1
}
```

---

## 👤 Users

### Upload Avatar
```http
POST /api/users/upload-avatar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data: avatar (single file)
```

---

## 🔧 Admin Routes

All admin routes require admin authorization.

### Get Dashboard Statistics
```http
GET /api/admin/dashboard
Authorization: Bearer {token}
```

### Get All Users
```http
GET /api/admin/users?role=seller&status=active&search=john&page=1&limit=20
Authorization: Bearer {token}
```

### Update User Status
```http
PATCH /api/admin/users/:id/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "isActive": false
}
```

### Verify Seller
```http
POST /api/admin/sellers/:id/verify
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "verified",
  "reason": "All documents verified"
}
```

**Status Options:** `verified`, `rejected`

### Get All Orders
```http
GET /api/admin/orders?status=pending&page=1&limit=20
Authorization: Bearer {token}
```

### Get Revenue Report
```http
GET /api/admin/revenue?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer {token}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here"
}
```

### Paginated Response
```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "pages": 10,
  "currentPage": 1,
  "data": [ ... ]
}
```

---

## 🔒 User Roles

- **buyer**: Can browse products, place orders, make payments
- **seller**: Can manage products, view orders, update order status
- **rider**: Can accept deliveries, update delivery status
- **admin**: Full access to all features and management tools

---

## 💰 Fee Structure

- **Escrow Fee**: ₦500 per transaction
- **Market Procurement Fee**: ₦1,500 - ₦5,000 (based on order amount)
  - < ₦5,000: ₦1,500
  - ₦5,000 - ₦10,000: ₦2,500
  - ₦10,000 - ₦20,000: ₦3,500
  - > ₦20,000: ₦5,000
- **Seller Commission**: 5% of items total
- **Rider Platform Fee**: 10% of delivery fee

---

## 🧪 Testing

Use tools like:
- **Postman**: Import the API endpoints
- **Thunder Client**: VS Code extension
- **cURL**: Command line testing

Example cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## 🛡️ Security Features

- JWT Authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- Input validation
- CORS configuration

---

## 📝 Notes

1. **Seller Verification**: Sellers must be verified before they can create products
2. **Escrow System**: Payments are held in escrow until buyer confirms delivery
3. **Order Flow**: pending → confirmed → shopping → ready_for_delivery → out_for_delivery → delivered
4. **Image Upload**: Max 5 images per product, 5MB per image
5. **Payment Gateway**: Currently integrated with Paystack

---

## 🐛 Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📧 Contact

For support: naijamall.contact@gmail.com
Phone: +2348137790780

---

## 📄 License

MIT License - Copyright (c) 2024 NaijaMall
