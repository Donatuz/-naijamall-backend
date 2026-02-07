const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/seller.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require seller authorization
router.use(protect, authorize('seller', 'admin', 'super_admin'));

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
