# NaijaMall Backend Setup Guide

Step-by-step guide to get your NaijaMall backend up and running.

## 📋 Step 1: Prerequisites

Install the following on your system:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB**
   - Option A: Install locally from https://www.mongodb.com/try/download/community
   - Option B: Use MongoDB Atlas (cloud) from https://www.mongodb.com/atlas
   - Verify: `mongod --version` (for local installation)

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## 📦 Step 2: Install Dependencies

```bash
cd naijamall-backend
npm install
```

This will install all required packages listed in `package.json`.

## 🔧 Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Open `.env` file and configure:

### Database Configuration
```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/naijamall

# OR for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naijamall
```

### JWT Configuration
```env
JWT_SECRET=your_very_long_and_secure_random_string_here
JWT_EXPIRE=7d
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cloudinary Setup (for image uploads)

1. Sign up at https://cloudinary.com/
2. Get your credentials from the dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Paystack Setup (for payments)

1. Sign up at https://paystack.com/
2. Get your API keys from Settings → API Keys & Webhooks
3. Add to `.env`:
```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
```

**Note:** Use test keys for development

### Other Settings
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🗄️ Step 4: Setup MongoDB

### Option A: Local MongoDB

1. Start MongoDB service:

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

2. Verify it's running:
```bash
mongosh
# or
mongo
```

### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string and add to `.env`

## 🚀 Step 5: Start the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
🚀 NaijaMall API Server running on port 5000
📱 Environment: development
✅ MongoDB Connected
```

## ✅ Step 6: Test the API

### Using Browser
Visit: http://localhost:5000/

You should see:
```json
{
  "message": "Welcome to NaijaMall API",
  "version": "1.0.0"
}
```

### Health Check
Visit: http://localhost:5000/api/health

### Using Postman

1. Create a new request
2. URL: `http://localhost:5000/api/auth/register`
3. Method: POST
4. Body (JSON):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+2348123456789",
  "password": "password123",
  "role": "buyer"
}
```

## 👤 Step 7: Create Admin User

You can create an admin user manually in MongoDB or through a script:

1. Register a normal user first
2. Connect to MongoDB:
```bash
mongosh naijamall
# or
mongo naijamall
```

3. Update user role to admin:
```javascript
db.users.updateOne(
  { email: "admin@naijamall.com" },
  { $set: { role: "admin" } }
)
```

## 📝 Step 8: Seed Initial Data (Optional)

Create some initial categories:

```bash
# Connect to MongoDB
mongosh naijamall
```

```javascript
// Insert categories
db.categories.insertMany([
  { name: "Vegetables", icon: "🥬", slug: "vegetables", isActive: true, order: 1 },
  { name: "Grains", icon: "🌾", slug: "grains", isActive: true, order: 2 },
  { name: "Meat", icon: "🥩", slug: "meat", isActive: true, order: 3 },
  { name: "Fruits", icon: "🍎", slug: "fruits", isActive: true, order: 4 },
  { name: "Dairy", icon: "🥛", slug: "dairy", isActive: true, order: 5 },
  { name: "Fish", icon: "🐟", slug: "fish", isActive: true, order: 6 },
  { name: "Snacks", icon: "🍿", slug: "snacks", isActive: true, order: 7 },
  { name: "Fresh Mix", icon: "🛒", slug: "fresh-mix", isActive: true, order: 8 }
])
```

## 🧪 Step 9: Test Complete Workflow

1. **Register a buyer**
2. **Register a seller**
3. **Verify seller** (as admin)
4. **Create products** (as seller)
5. **Browse products** (public)
6. **Create order** (as buyer)
7. **Initialize payment** (as buyer)
8. **Process order** (as seller)
9. **Assign rider** (as admin)
10. **Deliver order** (as rider)
11. **Confirm delivery** (as buyer)

## 🔍 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# Check MongoDB status
mongod --version
# Start MongoDB
net start MongoDB  # Windows
brew services start mongodb-community  # macOS
```

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change port in `.env` or kill the process using port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Cloudinary Upload Error
```
Error: Invalid cloud_name
```
**Solution:** Verify your Cloudinary credentials in `.env`

### Paystack Error
```
Error: Invalid Authorization
```
**Solution:** 
- Check your Paystack secret key in `.env`
- Make sure you're using the correct key (test vs live)
- Verify key hasn't been regenerated in Paystack dashboard

### JWT Token Error
```
Error: Invalid token
```
**Solution:**
- Make sure JWT_SECRET is set in `.env`
- Token format should be: `Bearer your_token_here`
- Check token hasn't expired

## 📱 Next Steps

1. **Connect Frontend**: Update frontend API URL to point to backend
2. **Deploy Backend**: Consider using Heroku, Render, or Railway
3. **Setup Email**: Configure nodemailer for email notifications
4. **Add Monitoring**: Use tools like PM2 for process management
5. **Setup CI/CD**: Automate testing and deployment

## 📚 Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests (when implemented)
npm test

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## 🆘 Need Help?

- Email: naijamall.contact@gmail.com
- Phone: +2348137790780
- Check the main README.md for API documentation

---

Happy Coding! 🚀
