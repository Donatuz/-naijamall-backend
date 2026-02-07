# Super Admin Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Update Your .env File

Open `naijamall-backend/.env` and add your super admin details:

```env
# Super Admin Initial Credentials
SUPER_ADMIN_EMAIL=youremail@example.com
SUPER_ADMIN_PASSWORD=YourSecurePassword@123
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
SUPER_ADMIN_PHONE=+2348012345678
```

**Important:** Replace with your actual details!

### Step 2: Restart Your Server

```bash
cd naijamall-backend
npm start
```

Look for this message:
```
✅ MongoDB Connected
✅ Super admin created successfully: youremail@example.com
```

### Step 3: Login

Go to https://naijamall.netlify.app (or your frontend URL) and login with your super admin email and password.

---

## ✨ What You Can Do Now

### 1. View All Users
- Navigate to Admin Dashboard → Users
- Or API: `GET /api/admin/users`

### 2. Change User Roles
- Click on any user
- Select new role from dropdown:
  - **Super Admin** - Full system access (can create other super admins)
  - **Admin** - Full admin access (cannot manage super admins)
  - **Customer Service** - Support staff access
  - **Agent** - Sales agent access
  - **Seller** - Merchant access
  - **Rider** - Delivery personnel access
  - **Buyer** - Regular customer

### 3. Create More Admins
```javascript
// Via API
PATCH /api/admin/users/{userId}/role
Body: { "role": "admin" }
```

---

## 🔐 Role Hierarchy

```
Level 7: Super Admin (YOU) ⭐
Level 6: Admin
Level 5: Customer Service
Level 4: Agent
Level 3: Seller
Level 2: Rider
Level 1: Buyer
```

**Rules:**
- You can manage ALL roles (including other super admins)
- Regular admins can only manage roles below them
- Nobody can modify users with equal/higher privileges (except super admins)

---

## 📝 Common Tasks

### Make Someone an Admin
1. Get their user ID from the users list
2. Use API endpoint:
```bash
curl -X PATCH https://your-api/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Make Someone a Super Admin (Super Admin Only)
```bash
curl -X PATCH https://your-api/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "super_admin"}'
```

### See All Available Roles
```bash
curl -X GET https://your-api/api/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Security Tips

1. **Use a strong password** for your super admin account
2. **Don't share** super admin credentials
3. **Create regular admins** for day-to-day operations
4. **Review user roles** regularly
5. **Keep your .env file** secure and never commit it

---

## 🔧 Troubleshooting

### "Super admin already exists"
✅ This is normal! Your super admin is already set up.

### Can't login
- Check your email and password in `.env`
- Make sure server is running
- Check MongoDB connection

### Permission denied
- Make sure you're logged in as super admin
- Check your token hasn't expired (tokens expire in 7 days)
- Try logging in again

### User role not changing
- Only super admin can create other super admins
- Admins can only modify lower roles
- Check the API response for specific error messages

---

## 📞 Need Help?

Check the detailed guide: `ROLE_MANAGEMENT_GUIDE.md`

Test the system: `node test-role-management.js`
