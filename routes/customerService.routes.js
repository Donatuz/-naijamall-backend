const express = require('express');
const router = express.Router();
const {
    getOrders,
    getMyOrders,
    assignOrderToAgent,
    getAvailableAgents,
    getOrderDetails,
    updateOrderNotes,
    getAnalytics
} = require('../controllers/customerService.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require customer service authorization
router.use(protect, authorize('customer_service', 'admin', 'super_admin'));

// Orders
router.get('/orders', getOrders);
router.get('/my-orders', getMyOrders);
router.get('/orders/:orderId', getOrderDetails);
router.post('/orders/:orderId/assign-agent', assignOrderToAgent);
router.patch('/orders/:orderId/notes', updateOrderNotes);

// Agents
router.get('/agents', getAvailableAgents);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
