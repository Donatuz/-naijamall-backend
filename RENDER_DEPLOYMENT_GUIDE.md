# 🚀 Render Deployment Guide - Super Admin Setup

## ✅ Your Code is Now on GitHub!

Your super admin role management system has been successfully pushed to GitHub and is ready for Render deployment!

**Repository:** https://github.com/Donatuz/-naijamall-backend.git

---

## 🌐 Deploy to Render (Step-by-Step)

### Step 1: Login to Render

1. Go to https://render.com
2. Login with your account (or sign up if you haven't)

---

### Step 2: Create New Web Service

1. Click **"New +"** button
2. Select **"Web Service"**
3. Choose **"Connect a repository"**
4. Select your repository: **-naijamall-backend**

---

### Step 3: Configure Your Service

Fill in these settings:

**Basic Settings:**
- **Name:** `naijamall-backend` (or any name you prefer)
- **Region:** Choose closest to Nigeria (e.g., Frankfurt, London)
- **Branch:** `main`
- **Root Directory:** Leave empty
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start` or `node server.js`

---

### Step 4: Add Environment Variables ⚠️ IMPORTANT!

Click **"Advanced"** → **"Add Environment Variable"**

Add ALL these variables:

#### Required - Database
```
MONGODB_URI=your_mongodb_atlas_connection_string
```

#### Required - JWT
```
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

#### Required - Super Admin (YOUR INFORMATION!)
```
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_PASSWORD=YourSecurePassword@123
SUPER_ADMIN_FIRST_NAME=Your
SUPER_ADMIN_LAST_NAME=Name
SUPER_ADMIN_PHONE=+2348012345678
```

#### Required - Frontend URL
```
FRONTEND_URL=https://naijamall.netlify.app
```

#### Optional - Node Environment
```
NODE_ENV=production
PORT=5000
```

#### Optional - Cloudinary (if using image uploads)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Optional - Paystack (if using payments)
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

#### Optional - Email (if using notifications)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will start deploying your app
3. Wait for the build to complete (2-5 minutes)

---

### Step 6: Verify Deployment

Once deployed, check the logs:

**You should see:**
```
✅ MongoDB Connected
✅ Super admin created successfully: your-email@example.com
   Name: Your Name
   Role: super_admin
🚀 NaijaMall API Server running on port 5000
```

**Your API URL will be:**
```
https://naijamall-backend.onrender.com
```

---

## 🔗 Update Your Frontend

After deployment, update your frontend `api-config.js`:

```javascript
const API_URL = 'https://naijamall-backend.onrender.com';
```

Or if you have `api-config.prod.js`:
```javascript
const API_URL = 'https://naijamall-backend.onrender.com';
```

---

## 🧪 Test Your Deployment

### Test 1: Health Check
```bash
curl https://naijamall-backend.onrender.com/api/health
```

### Test 2: Login as Super Admin
```bash
curl -X POST https://naijamall-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourSecurePassword@123"
  }'
```

### Test 3: Get Roles (after login)
```bash
curl -X GET https://naijamall-backend.onrender.com/api/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚙️ Render-Specific Configuration

### Free Tier Notes:
- ⚠️ **Free tier services sleep after 15 minutes of inactivity**
- First request after sleep takes 30-50 seconds to wake up
- Consider upgrading to paid plan for production use

### Auto-Deploy:
- ✅ Render automatically deploys when you push to GitHub
- Every `git push` triggers a new deployment
- No manual deployment needed!

### View Logs:
- Click on your service in Render dashboard
- Go to **"Logs"** tab
- Check for super admin creation message

---

## 🔒 Security Best Practices for Render

### 1. Environment Variables
- ✅ All sensitive data in environment variables
- ✅ Never commit `.env` to GitHub
- ✅ Use Render's environment variable feature

### 2. MongoDB Atlas
- ✅ Whitelist Render's IP addresses
- ✅ Or allow access from anywhere (0.0.0.0/0) for Render
- ✅ Use strong MongoDB password

### 3. CORS Configuration
Your code already handles this! It allows:
- `https://naijamall.netlify.app`
- `*.netlify.app` domains
- Your configured `FRONTEND_URL`

---

## 🐛 Troubleshooting Render Deployment

### Problem: Build Fails
**Solution:**
- Check Render build logs
- Verify `package.json` has all dependencies
- Make sure Node version is compatible

### Problem: Super Admin Not Created
**Solution:**
- Check Render logs for error messages
- Verify `MONGODB_URI` is correct
- Verify all `SUPER_ADMIN_*` environment variables are set
- Check MongoDB connection

### Problem: Can't Connect to Database
**Solution:**
- Verify MongoDB Atlas allows connections from anywhere
- Check `MONGODB_URI` format: `mongodb+srv://user:pass@cluster.mongodb.net/naijamall`
- Ensure database user has read/write permissions

### Problem: CORS Errors
**Solution:**
- Add your frontend URL to `FRONTEND_URL` environment variable
- Verify frontend is making requests to correct backend URL
- Check Render logs for CORS errors

### Problem: Service Keeps Sleeping
**Solution:**
- Upgrade to paid Render plan ($7/month)
- Or use a service like UptimeRobot to ping your API every 5 minutes

---

## 📊 MongoDB Atlas Setup (If Needed)

If you haven't set up MongoDB Atlas:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster (free M0 tier)
4. Create database user
5. Network Access → Allow access from anywhere (0.0.0.0/0)
6. Get connection string
7. Replace `<password>` in connection string
8. Add to Render environment variables as `MONGODB_URI`

---

## 🎯 Post-Deployment Checklist

- [ ] Render service is deployed and running
- [ ] Logs show "Super admin created successfully"
- [ ] MongoDB connection successful
- [ ] Health check endpoint works
- [ ] Can login as super admin
- [ ] Can fetch roles from API
- [ ] Frontend connected to backend
- [ ] CORS working correctly
- [ ] Environment variables all set

---

## 🚀 Your Deployment URLs

**Backend API:** `https://naijamall-backend.onrender.com` (or your custom name)  
**Frontend:** `https://naijamall.netlify.app`  
**GitHub Repo:** `https://github.com/Donatuz/-naijamall-backend`

---

## 📱 Test the Full Flow

1. **Deploy backend to Render** ✓
2. **Update frontend API URL** to point to Render
3. **Login** at https://naijamall.netlify.app
4. **Navigate to admin dashboard**
5. **Test role management** - change a user's role
6. **Success!** 🎉

---

## 💡 Tips for Production

### Performance:
- Consider upgrading from free tier for faster response times
- Use Redis for caching (if needed later)
- Monitor response times in Render dashboard

### Monitoring:
- Set up Render alerts for service issues
- Monitor Render logs regularly
- Use external monitoring (e.g., UptimeRobot, Pingdom)

### Scaling:
- Render auto-scales on paid plans
- Monitor resource usage in dashboard
- Upgrade plan as traffic grows

---

## 🆘 Need Help?

### Render Documentation:
- https://render.com/docs
- https://render.com/docs/deploy-node-express-app

### Your Documentation:
- Check logs in Render dashboard
- Review `WHAT_TO_DO_NEXT.md` for API usage
- Test with `test-role-management.js` script (update API_URL first)

### Common Issues:
- **Service sleeping:** Upgrade to paid plan
- **Database connection:** Check MongoDB Atlas settings
- **Environment vars:** Double-check all are set correctly

---

## ✅ Success Checklist

After following this guide:

- [x] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables configured
- [ ] Service deployed successfully
- [ ] Super admin created (check logs)
- [ ] API accessible
- [ ] Frontend connected
- [ ] Tested login
- [ ] Tested role management

---

## 🎉 You're All Set!

Your NaijaMall backend with super admin role management is now:
- ✅ On GitHub
- ✅ Ready for Render deployment
- ✅ Configured for production
- ✅ Secure and scalable

**Next Steps:**
1. Deploy to Render following steps above
2. Update frontend API URL
3. Login and start managing roles!

---

**Questions?** Check the documentation files or Render support!

**Happy Deploying! 🚀**
