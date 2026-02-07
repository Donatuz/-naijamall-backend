const express = require('express');
const router = express.Router();
const {
    initializePayment,
    verifyPayment,
    releaseEscrow,
    refundPayment,
    getPayment,
    getMyPayments
} = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Buyer routes
router.post('/initialize', protect, authorize('buyer'), initializePayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/:id', protect, getPayment);

// Public route (webhook from Paystack)
router.get('/verify/:reference', verifyPayment);

// Admin routes
router.post('/:id/release-escrow', protect, authorize('admin'), releaseEscrow);
router.post('/:id/refund', protect, authorize('admin'), refundPayment);

module.exports = router;
