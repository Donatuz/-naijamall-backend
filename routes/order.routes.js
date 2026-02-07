const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrder,
    updateOrderStatus,
    confirmDelivery,
    cancelOrder,
    assignRider
} = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Buyer routes
router.post('/', protect, authorize('buyer'), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.post('/:id/confirm', protect, authorize('buyer'), confirmDelivery);
router.post('/:id/cancel', protect, cancelOrder);

// Seller/Rider/Admin routes
router.patch('/:id/status', protect, updateOrderStatus);

// Admin routes
router.post('/:id/assign-rider', protect, authorize('admin'), assignRider);

module.exports = router;
