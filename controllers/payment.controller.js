const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const axios = require('axios');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private (Buyer)
exports.initializePayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Get order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if buyer owns the order
        if (order.buyer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Check if already paid
        if (order.paymentStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Order already has a payment'
            });
        }

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            buyer: req.user.id,
            amount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentGateway: 'paystack',
            fees: {
                escrowFee: order.escrowFee,
                marketProcurementFee: order.marketProcurementFee
            }
        });

        // Initialize Paystack payment
        try {
            const paystackResponse = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email: req.user.email,
                    amount: order.totalAmount * 100, // Convert to kobo
                    reference: payment.reference,
                    callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
                    metadata: {
                        orderId: order._id.toString(),
                        orderNumber: order.orderNumber,
                        buyer: req.user.email
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            payment.gatewayReference = paystackResponse.data.data.reference;
            payment.status = 'processing';
            await payment.save();

            res.status(200).json({
                success: true,
                message: 'Payment initialized',
                data: {
                    paymentReference: payment.reference,
                    authorizationUrl: paystackResponse.data.data.authorization_url,
                    accessCode: paystackResponse.data.data.access_code
                }
            });
        } catch (paystackError) {
            console.error('Paystack error:', paystackError.response?.data || paystackError.message);
            
            payment.status = 'failed';
            payment.failureReason = paystackError.response?.data?.message || 'Payment gateway error';
            await payment.save();

            res.status(500).json({
                success: false,
                message: 'Error initializing payment gateway',
                error: paystackError.response?.data?.message
            });
        }
    } catch (error) {
        console.error('Initialize payment error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error initializing payment'
        });
    }
};

// @desc    Verify payment
// @route   GET /api/payments/verify/:reference
// @access  Public (called by Paystack)
exports.verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;

        const payment = await Payment.findOne({ reference }).populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify with Paystack
        try {
            const paystackResponse = await axios.get(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                    }
                }
            );

            const paystackData = paystackResponse.data.data;

            if (paystackData.status === 'success') {
                // Update payment
                payment.status = 'held_in_escrow';
                payment.escrowStatus = 'held';
                payment.escrowHeldAt = new Date();
                payment.transactionId = paystackData.id;
                payment.gatewayResponse = paystackData;
                await payment.save();

                // Update order
                const order = await Order.findById(payment.order);
                order.paymentStatus = 'held_in_escrow';
                order.paymentReference = payment.reference;
                order.status = 'confirmed';
                await order.save();

                await order.addTracking('confirmed', 'Payment received and held in escrow');

                res.status(200).json({
                    success: true,
                    message: 'Payment verified and held in escrow',
                    data: {
                        payment,
                        order
                    }
                });
            } else {
                payment.status = 'failed';
                payment.failureReason = paystackData.gateway_response;
                payment.failedAt = new Date();
                await payment.save();

                res.status(400).json({
                    success: false,
                    message: 'Payment verification failed',
                    data: paystackData
                });
            }
        } catch (paystackError) {
            console.error('Paystack verify error:', paystackError.response?.data || paystackError.message);
            
            res.status(500).json({
                success: false,
                message: 'Error verifying payment with gateway'
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment'
        });
    }
};

// @desc    Release escrow to sellers
// @route   POST /api/payments/:id/release-escrow
// @access  Private (Admin or automatic on buyer confirmation)
exports.releaseEscrow = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.escrowStatus !== 'held') {
            return res.status(400).json({
                success: false,
                message: 'Payment is not in escrow'
            });
        }

        const order = payment.order;

        // Calculate distribution
        const distributions = [];
        
        // Calculate seller commission (5%)
        const sellerCommission = order.itemsTotal * 0.05;
        
        // Group items by seller
        const sellerTotals = {};
        order.items.forEach(item => {
            const sellerId = item.seller.toString();
            if (!sellerTotals[sellerId]) {
                sellerTotals[sellerId] = 0;
            }
            sellerTotals[sellerId] += item.subtotal;
        });

        // Create distributions for sellers (after commission)
        for (const [sellerId, total] of Object.entries(sellerTotals)) {
            const sellerShare = total - (total * 0.05); // Deduct 5% commission
            distributions.push({
                recipient: sellerId,
                recipientType: 'seller',
                amount: sellerShare,
                status: 'completed',
                paidAt: new Date()
            });
        }

        // Rider gets 90% of delivery fee (platform keeps 10%)
        if (order.rider) {
            const riderAmount = order.deliveryFee * 0.90;
            distributions.push({
                recipient: order.rider,
                recipientType: 'rider',
                amount: riderAmount,
                status: 'completed',
                paidAt: new Date()
            });
        }

        // Platform fees
        const platformTotal = 
            order.escrowFee + 
            order.marketProcurementFee + 
            sellerCommission + 
            (order.deliveryFee * 0.10);

        distributions.push({
            recipientType: 'platform',
            amount: platformTotal,
            status: 'completed',
            paidAt: new Date()
        });

        // Update payment
        payment.distribution = distributions;
        payment.escrowStatus = 'released_to_sellers';
        payment.escrowReleasedAt = new Date();
        payment.escrowReleaseReason = req.body.reason || 'Buyer confirmed delivery';
        payment.status = 'released';
        payment.fees.sellerCommission = sellerCommission;
        payment.fees.riderFee = order.deliveryFee * 0.10;
        payment.fees.platformTotal = platformTotal;
        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Escrow released successfully',
            data: payment
        });
    } catch (error) {
        console.error('Release escrow error:', error);
        res.status(500).json({
            success: false,
            message: 'Error releasing escrow'
        });
    }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private (Admin)
exports.refundPayment = async (req, res) => {
    try {
        const { reason } = req.body;

        const payment = await Payment.findById(req.params.id).populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.escrowStatus !== 'held') {
            return res.status(400).json({
                success: false,
                message: 'Payment cannot be refunded'
            });
        }

        // Initiate refund with Paystack
        try {
            const paystackResponse = await axios.post(
                `${PAYSTACK_BASE_URL}/refund`,
                {
                    transaction: payment.transactionId || payment.gatewayReference,
                    amount: payment.amount * 100 // Convert to kobo
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            payment.status = 'refunded';
            payment.escrowStatus = 'refunded_to_buyer';
            payment.refund = {
                amount: payment.amount,
                reason,
                refundedAt: new Date(),
                refundReference: paystackResponse.data.data.transaction.reference
            };
            await payment.save();

            // Update order
            const order = await Order.findById(payment.order);
            order.paymentStatus = 'refunded';
            order.status = 'refunded';
            await order.save();

            await order.addTracking('refunded', reason || 'Payment refunded');

            res.status(200).json({
                success: true,
                message: 'Payment refunded successfully',
                data: payment
            });
        } catch (paystackError) {
            console.error('Paystack refund error:', paystackError.response?.data || paystackError.message);
            
            res.status(500).json({
                success: false,
                message: 'Error processing refund with payment gateway'
            });
        }
    } catch (error) {
        console.error('Refund payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error refunding payment'
        });
    }
};

// @desc    Get payment details
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order')
            .populate('buyer', 'firstName lastName email')
            .populate('distribution.recipient', 'firstName lastName businessName');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check authorization
        const isAuthorized = 
            payment.buyer._id.toString() === req.user.id ||
            payment.distribution.some(d => d.recipient && d.recipient._id.toString() === req.user.id) ||
            req.user.role === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payment'
        });
    }
};

// @desc    Get payment history
// @route   GET /api/payments/my-payments
// @access  Private
exports.getMyPayments = async (req, res) => {
    try {
        const query = { buyer: req.user.id };

        const payments = await Payment.find(query)
            .populate('order', 'orderNumber status totalAmount')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching payment history'
        });
    }
};
