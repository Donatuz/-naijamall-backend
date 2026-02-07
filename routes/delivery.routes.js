const express = require('express');
const router = express.Router();
const {
    getAvailableDeliveries,
    getMyDeliveries,
    acceptDelivery,
    updateDeliveryStatus,
    getRiderStats,
    getAllRiders
} = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Rider routes
router.get('/available', protect, authorize('rider'), getAvailableDeliveries);
router.get('/my-deliveries', protect, authorize('rider'), getMyDeliveries);
router.post('/:orderId/accept', protect, authorize('rider'), acceptDelivery);
router.patch('/:orderId/status', protect, authorize('rider'), updateDeliveryStatus);
router.get('/stats', protect, authorize('rider'), getRiderStats);

// Admin routes
router.get('/riders', protect, authorize('admin'), getAllRiders);

module.exports = router;
