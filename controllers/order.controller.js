const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const Payment = require('../models/Payment.model');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer)
exports.createOrder = async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            buyerNotes
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items provided'
            });
        }

        // Validate and calculate order
        let itemsTotal = 0;
        const orderItems = [];

        for (let item of items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.product} not found`
                });
            }

            if (!product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${product.name} is not available`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            const subtotal = product.price * item.quantity;
            itemsTotal += subtotal;

            orderItems.push({
                product: product._id,
                seller: product.seller,
                quantity: item.quantity,
                price: product.price,
                subtotal
            });
        }

        // Calculate fees
        const escrowFee = 500;
        let marketProcurementFee = 0;

        if (itemsTotal < 5000) {
            marketProcurementFee = 1500;
        } else if (itemsTotal < 10000) {
            marketProcurementFee = 2500;
        } else if (itemsTotal < 20000) {
            marketProcurementFee = 3500;
        } else {
            marketProcurementFee = 5000;
        }

        // Calculate delivery fee based on location (simplified)
        const deliveryFee = 1000; // You can make this dynamic based on distance

        const totalAmount = itemsTotal + escrowFee + marketProcurementFee + deliveryFee;

        // Create order
        const order = await Order.create({
            buyer: req.user.id,
            items: orderItems,
            shippingAddress,
            itemsTotal,
            escrowFee,
            marketProcurementFee,
            deliveryFee,
            totalAmount,
            paymentMethod,
            buyerNotes
        });

        // Add initial tracking
        await order.addTracking('pending', 'Order placed successfully');

        // Populate order details
        await order.populate([
            { path: 'buyer', select: 'firstName lastName email phone' },
            { path: 'items.product', select: 'name price images unit' },
            { path: 'items.seller', select: 'firstName lastName businessName' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating order'
        });
    }
};

// @desc    Get all orders for current user
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = {};

        // Different queries based on user role
        if (req.user.role === 'buyer') {
            query.buyer = req.user.id;
        } else if (req.user.role === 'seller') {
            query['items.seller'] = req.user.id;
        } else if (req.user.role === 'rider') {
            query.rider = req.user.id;
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName phone')
            .populate('items.product', 'name images')
            .populate('rider', 'firstName lastName phone')
            .sort('-createdAt')
            .limit(Number(limit))
            .skip(skip);

        const total = await Order.countDocuments(query);

        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: orders
        });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('buyer', 'firstName lastName email phone address')
            .populate('items.product', 'name price images unit')
            .populate('items.seller', 'firstName lastName businessName phone')
            .populate('rider', 'firstName lastName phone vehicleType vehicleNumber')
            .populate('shoppingAgent', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        const isAuthorized = 
            order.buyer.toString() === req.user.id ||
            order.items.some(item => item.seller.toString() === req.user.id) ||
            (order.rider && order.rider._id.toString() === req.user.id) ||
            req.user.role === 'admin';

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order'
        });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, description } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Authorization check based on role
        let isAuthorized = false;
        if (req.user.role === 'admin') {
            isAuthorized = true;
        } else if (req.user.role === 'seller' && ['confirmed', 'shopping', 'ready_for_delivery'].includes(status)) {
            isAuthorized = order.items.some(item => item.seller.toString() === req.user.id);
        } else if (req.user.role === 'rider' && ['out_for_delivery', 'delivered'].includes(status)) {
            isAuthorized = order.rider && order.rider.toString() === req.user.id;
        }

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        order.status = status;

        if (status === 'delivered') {
            order.actualDeliveryTime = new Date();
            order.deliveryStatus = 'delivered';
        }

        await order.save();
        await order.addTracking(status, description || `Order status updated to ${status}`);

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating order status'
        });
    }
};

// @desc    Buyer confirms order delivery
// @route   POST /api/orders/:id/confirm
// @access  Private (Buyer)
exports.confirmDelivery = async (req, res) => {
    try {
        const { feedback } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.buyer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Order must be delivered before confirmation'
            });
        }

        order.buyerConfirmation = {
            confirmed: true,
            confirmedAt: new Date(),
            feedback
        };

        order.paymentStatus = 'released';
        await order.save();

        // Update payment to release escrow
        const payment = await Payment.findOne({ order: order._id });
        if (payment) {
            payment.status = 'released';
            payment.escrowStatus = 'released_to_sellers';
            payment.escrowReleasedAt = new Date();
            payment.escrowReleaseReason = 'Buyer confirmed delivery';
            await payment.save();
        }

        await order.addTracking('completed', 'Buyer confirmed delivery - Escrow released');

        res.status(200).json({
            success: true,
            message: 'Delivery confirmed. Payment released to sellers.',
            data: order
        });
    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming delivery'
        });
    }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Only buyer or admin can cancel
        if (order.buyer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can't cancel if already delivered
        if (['delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }

        order.status = 'cancelled';
        order.cancellationReason = reason;
        order.cancelledBy = req.user.id;
        order.cancelledAt = new Date();

        await order.save();
        await order.addTracking('cancelled', reason || 'Order cancelled');

        // Refund payment if already paid
        const payment = await Payment.findOne({ order: order._id });
        if (payment && payment.status === 'held_in_escrow') {
            payment.status = 'refunded';
            payment.escrowStatus = 'refunded_to_buyer';
            payment.refund = {
                amount: payment.amount,
                reason: 'Order cancelled',
                refundedAt: new Date()
            };
            await payment.save();
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order'
        });
    }
};

// @desc    Assign rider to order
// @route   POST /api/orders/:id/assign-rider
// @access  Private (Admin)
exports.assignRider = async (req, res) => {
    try {
        const { riderId } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.rider = riderId;
        order.deliveryStatus = 'assigned';
        await order.save();

        await order.addTracking('assigned_rider', 'Rider assigned to order');

        res.status(200).json({
            success: true,
            message: 'Rider assigned successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning rider'
        });
    }
};
