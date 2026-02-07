const Order = require('../models/Order.model');
const User = require('../models/User.model');

// @desc    Get available deliveries for riders
// @route   GET /api/deliveries/available
// @access  Private (Rider)
exports.getAvailableDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({
            status: 'ready_for_delivery',
            deliveryStatus: 'not_assigned'
        })
            .populate('buyer', 'firstName lastName phone address')
            .populate('items.product', 'name images')
            .sort('createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available deliveries'
        });
    }
};

// @desc    Get rider's assigned deliveries
// @route   GET /api/deliveries/my-deliveries
// @access  Private (Rider)
exports.getMyDeliveries = async (req, res) => {
    try {
        const { status } = req.query;

        const query = { rider: req.user.id };

        if (status) {
            query.deliveryStatus = status;
        }

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName phone address')
            .populate('items.product', 'name images')
            .populate('items.seller', 'firstName lastName businessName phone')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deliveries'
        });
    }
};

// @desc    Accept delivery
// @route   POST /api/deliveries/:orderId/accept
// @access  Private (Rider)
exports.acceptDelivery = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.deliveryStatus !== 'not_assigned') {
            return res.status(400).json({
                success: false,
                message: 'Order already assigned'
            });
        }

        order.rider = req.user.id;
        order.deliveryStatus = 'assigned';
        await order.save();

        await order.addTracking('rider_assigned', `Rider ${req.user.firstName} ${req.user.lastName} accepted delivery`);

        res.status(200).json({
            success: true,
            message: 'Delivery accepted successfully',
            data: order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error accepting delivery'
        });
    }
};

// @desc    Update delivery status
// @route   PATCH /api/deliveries/:orderId/status
// @access  Private (Rider)
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { status, location, notes } = req.body;

        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if rider owns the delivery
        if (!order.rider || order.rider.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const validStatuses = ['picked_up', 'in_transit', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid delivery status'
            });
        }

        order.deliveryStatus = status;

        if (status === 'picked_up') {
            order.status = 'out_for_delivery';
            await order.addTracking('picked_up', 'Order picked up by rider', location);
        } else if (status === 'in_transit') {
            await order.addTracking('in_transit', notes || 'Order in transit', location);
        } else if (status === 'delivered') {
            order.status = 'delivered';
            order.actualDeliveryTime = new Date();
            await order.addTracking('delivered', 'Order delivered to buyer', location);
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Delivery status updated',
            data: order
        });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating delivery status'
        });
    }
};

// @desc    Get delivery statistics for rider
// @route   GET /api/deliveries/stats
// @access  Private (Rider)
exports.getRiderStats = async (req, res) => {
    try {
        const totalDeliveries = await Order.countDocuments({ 
            rider: req.user.id,
            status: 'delivered'
        });

        const pendingDeliveries = await Order.countDocuments({
            rider: req.user.id,
            deliveryStatus: { $in: ['assigned', 'picked_up', 'in_transit'] }
        });

        const totalEarnings = await Order.aggregate([
            { $match: { rider: req.user._id, status: 'delivered', paymentStatus: 'released' } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$deliveryFee', 0.90] } } } }
        ]);

        const stats = {
            totalDeliveries,
            pendingDeliveries,
            totalEarnings: totalEarnings[0]?.total || 0,
            rating: req.user.rating || 0
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching rider stats'
        });
    }
};

// @desc    Get all riders (for admin)
// @route   GET /api/deliveries/riders
// @access  Private (Admin)
exports.getAllRiders = async (req, res) => {
    try {
        const riders = await User.find({ 
            role: 'rider',
            isActive: true
        }).select('-password');

        res.status(200).json({
            success: true,
            count: riders.length,
            data: riders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching riders'
        });
    }
};
