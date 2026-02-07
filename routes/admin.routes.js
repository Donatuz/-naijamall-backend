const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    verifySeller,
    getAllOrders,
    getRevenueReport,
    deleteUser,
    updateUserRole,
    getRoles
} = require('../controllers/admin.controller');
const { getAnalytics } = require('../controllers/analytics.controller');
const { protect, authorize, authorizeMinRole, isSuperAdmin } = require('../middleware/auth.middleware');

// All routes require at least admin authorization
router.use(protect, authorizeMinRole('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Roles management
router.get('/roles', getRoles);

// Users management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole); // Role management - hierarchical permissions applied in controller
router.delete('/users/:id', deleteUser);

// Sellers verification
router.post('/sellers/:id/verify', verifySeller);

// Orders management
router.get('/orders', getAllOrders);

// Revenue reports
router.get('/revenue', getRevenueReport);

// Analytics data for charts
router.get('/analytics', getAnalytics);

module.exports = router;
