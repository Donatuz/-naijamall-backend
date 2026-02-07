# Role Management System - Complete Guide

## Overview
NaijaMall now includes a comprehensive hierarchical role management system that allows super admins to create and manage different user roles with varying permission levels.

## Role Hierarchy

The system uses a 7-level role hierarchy:

| Level | Role | Description | Capabilities |
|-------|------|-------------|--------------|
| 7 | **Super Admin** | Complete system access | Can manage all roles including other super admins |
| 6 | **Admin** | Full administrative access | Can manage users, orders, sellers (except role changes to admin+) |
| 5 | **Customer Service** | Support staff | Can view and manage orders, help customers |
| 4 | **Agent** | Sales agent | Limited admin access, can manage products |
| 3 | **Seller** | Merchant | Can sell products, manage their inventory |
| 2 | **Rider** | Delivery personnel | Can accept and deliver orders |
| 1 | **Buyer** | Regular customer | Can purchase products |

## Initial Setup - Creating Your Super Admin

### Step 1: Configure Environment Variables

Add these variables to your `.env` file:

```env
# Super Admin Initial Credentials (for first-time setup)
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=YourSecurePassword@123
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
SUPER_ADMIN_PHONE=+2348000000000
```

### Step 2: Restart Your Server

When the server starts, it will automatically:
1. Check if a super admin exists
2. If not, create one with the credentials from your `.env`
3. If the email exists but isn't a super admin, upgrade it

```bash
cd naijamall-backend
npm start
```

You should see:
```
✅ MongoDB Connected
✅ Super admin created successfully: your-email@example.com
   Name: Your Name
   Role: super_admin
```

### Step 3: Login

Use your super admin credentials to login at:
- Production: https://naijamall.netlify.app
- Local: http://localhost:5500

## API Endpoints

### 1. Get All Available Roles

**GET** `/api/admin/roles`

Returns all roles available based on your permission level.

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "value": "buyer",
      "label": "Buyer",
      "description": "Regular customer who can purchase products",
      "level": 1
    },
    // ... more roles
  ],
  "currentUserRole": "super_admin",
  "currentUserLevel": 7
}
```

### 2. Update User Role

**PATCH** `/api/admin/users/:userId/role`

Change a user's role. Permission checks apply:
- Super admins can change any role
- Regular admins can only modify roles below their level
- Cannot modify your own role (except super admin)

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "role": "admin"
}
```

**Valid roles:** `buyer`, `rider`, `seller`, `agent`, `customer_service`, `admin`, `super_admin`

**Response:**
```json
{
  "success": true,
  "message": "User role updated from buyer to admin",
  "data": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "admin"
  }
}
```

### 3. Get All Users

**GET** `/api/admin/users?role=buyer&search=john&page=1&limit=20`

List users with optional filters.

**Query Parameters:**
- `role` - Filter by role (buyer, seller, admin, etc.)
- `status` - Filter by status (active, inactive)
- `search` - Search by name, email, or phone
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20)

### 4. Update User Status

**PATCH** `/api/admin/users/:userId/status`

Activate or deactivate a user account.

**Body:**
```json
{
  "isActive": false
}
```

### 5. Delete User

**DELETE** `/api/admin/users/:userId`

Delete a user. Cannot delete users with equal or higher privileges.

## Permission Rules

### Role Modification Rules

1. **Super Admin** (`super_admin`)
   - Can create other super admins
   - Can modify any user's role
   - Can modify own role

2. **Regular Admin** (`admin`)
   - Cannot create super admins or other admins
   - Can only modify roles below admin level
   - Cannot modify own role
   - Cannot modify super admin accounts

3. **Lower Roles**
   - Do not have access to role management endpoints

### Deletion Rules

- Users can only delete accounts with **lower** privilege levels
- Super admins can delete anyone except themselves
- Admins cannot delete other admins or super admins

### Status Update Rules

- Similar hierarchy rules apply
- Cannot deactivate users with equal or higher privileges

## Frontend Integration

### Example: Get Roles and Display

```javascript
async function getRoles() {
  const response = await fetch('https://your-api.com/api/admin/roles', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data; // Array of roles
}
```

### Example: Update User Role

```javascript
async function updateUserRole(userId, newRole) {
  const response = await fetch(`https://your-api.com/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: newRole })
  });
  return await response.json();
}
```

### Example: Role Selector UI

```html
<select id="roleSelect" onchange="updateRole(userId, this.value)">
  <option value="">Select Role</option>
  <!-- These will be populated from /api/admin/roles endpoint -->
  <option value="buyer">Buyer</option>
  <option value="rider">Rider/Driver</option>
  <option value="seller">Seller</option>
  <option value="agent">Agent</option>
  <option value="customer_service">Customer Service</option>
  <option value="admin">Admin</option>
  <option value="super_admin">Super Admin</option>
</select>
```

## Testing the System

### Test 1: Create Super Admin
```bash
# Set environment variables in .env
# Restart server
npm start

# Check MongoDB for super admin user
# Or use the test script provided
```

### Test 2: Login as Super Admin
```bash
# Use Postman or curl
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@naijamall.com",
    "password": "SuperAdmin@123"
  }'
```

### Test 3: Get Available Roles
```bash
curl -X GET https://your-api.com/api/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Change User Role
```bash
curl -X PATCH https://your-api.com/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Security Considerations

1. **Protect Super Admin Credentials**: Use strong passwords and store them securely
2. **Limit Super Admins**: Only create super admin accounts for trusted personnel
3. **Audit Logs**: Consider implementing audit logging for role changes
4. **Regular Reviews**: Periodically review user roles and permissions
5. **Environment Variables**: Never commit `.env` file with actual credentials

## Migration from Old System

If you have existing admins created manually in MongoDB:

1. They will continue to work as regular admins
2. They cannot manage roles or create other admins
3. Only super admin can create new admins

To upgrade an existing admin to super admin:
```javascript
// Option 1: Update via MongoDB
db.users.updateOne(
  { email: "existing@admin.com" },
  { $set: { role: "super_admin" } }
)

// Option 2: Add to .env and restart server
SUPER_ADMIN_EMAIL=existing@admin.com
```

## Troubleshooting

### Super Admin Not Created
- Check MongoDB connection
- Verify environment variables are set correctly
- Check server logs for error messages

### Cannot Update Roles
- Verify you're logged in as super admin or admin
- Check token is valid and not expired
- Ensure target user exists
- Verify role hierarchy permissions

### Permission Denied Errors
- Check your current role level
- Verify you're not trying to modify higher-level users
- Super admin can bypass most restrictions

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify JWT token is valid
3. Ensure user has appropriate permissions
4. Review the role hierarchy chart above
