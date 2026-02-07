const express = require('express');
const router = express.Router();
const {
    getMyAssignedOrders,
    getOrderDetails,
    updateOrderStatus,
    completeShoppingTask,
    getAgentStats,
    getAnalytics
} = require('../controllers/agent.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require agent authorization
router.use(protect, authorize('agent', 'admin', 'super_admin'));

// Orders
router.get('/orders', getMyAssignedOrders);
router.get('/orders/:orderId', getOrderDetails);
router.patch('/orders/:orderId/status', updateOrderStatus);
router.post('/orders/:orderId/complete-shopping', completeShoppingTask);

// Stats
router.get('/stats', getAgentStats);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
