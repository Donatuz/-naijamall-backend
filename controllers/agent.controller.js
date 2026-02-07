const Order = require('../models/Order.model');
const User = require('../models/User.model');

// @desc    Get orders assigned to current agent
// @route   GET /api/agent/orders
// @access  Private (Agent)
exports.getMyAssignedOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {
            assignedAgent: req.user._id
        };
        
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName email phone')
            .populate('customerService', 'firstName lastName phone')
            .populate('rider', 'firstName lastName phone')
            .populate('items.product', 'name price images description')
            .populate('items.seller', 'firstName lastName businessName phone')
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
        console.error('Get assigned orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assigned orders'
        });
    }
};

// @desc    Get single order details
// @route   GET /api/agent/orders/:orderId
// @access  Private (Agent)
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            assignedAgent: req.user._id
        })
            .populate('buyer', 'firstName lastName email phone address')
            .populate('customerService', 'firstName lastName email phone')
            .populate('rider', 'firstName lastName email phone vehicleType')
            .populate('items.product', 'name price images description')
            .populate('items.seller', 'firstName lastName businessName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not assigned to you'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order details'
        });
    }
};

// @desc    Update order status (agent perspective)
// @route   PATCH /api/agent/orders/:orderId/status
// @access  Private (Agent)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const { orderId } = req.params;

        // Valid status transitions for agent
        const validStatuses = ['shopping', 'ready_for_delivery'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses for agents: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            assignedAgent: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not assigned to you'
            });
        }

        const oldStatus = order.status;
        order.status = status;

        // Add tracking
        let trackingDescription;
        if (status === 'shopping') {
            trackingDescription = 'Agent is shopping for your items at the market';
        } else if (status === 'ready_for_delivery') {
            trackingDescription = 'Items purchased and ready for delivery';
        }

        await order.addTracking(status, trackingDescription, '');

        // Add internal notes if provided
        if (notes) {
            order.internalNotes = (order.internalNotes || '') + `\n[Agent - ${new Date().toLocaleString()}]: ${notes}`;
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: `Order status updated from ${oldStatus} to ${status}`,
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

// @desc    Mark shopping as complete
// @route   POST /api/agent/orders/:orderId/complete-shopping
// @access  Private (Agent)
exports.completeShoppingTask = async (req, res) => {
    try {
        const { notes, actualItemsPurchased } = req.body;
        const { orderId } = req.params;

        const order = await Order.findOne({
            _id: orderId,
            assignedAgent: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or not assigned to you'
            });
        }

        // Update order status
        order.status = 'ready_for_delivery';
        
        // Add completion notes
        const completionNote = `Shopping completed by ${req.user.firstName} ${req.user.lastName}. ${notes || ''}`;
        order.internalNotes = (order.internalNotes || '') + `\n[${new Date().toLocaleString()}]: ${completionNote}`;

        // Add tracking
        await order.addTracking(
            'ready_for_delivery',
            'Market shopping completed. Items ready for delivery.',
            ''
        );

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Shopping task marked as complete',
            data: order
        });
    } catch (error) {
        console.error('Complete shopping error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing shopping task'
        });
    }
};

// @desc    Get agent statistics
// @route   GET /api/agent/stats
// @access  Private (Agent)
exports.getAgentStats = async (req, res) => {
    try {
        const totalAssigned = await Order.countDocuments({
            assignedAgent: req.user._id
        });

        const inProgress = await Order.countDocuments({
            assignedAgent: req.user._id,
            status: 'shopping'
        });

        const completed = await Order.countDocuments({
            assignedAgent: req.user._id,
            status: { $in: ['ready_for_delivery', 'out_for_delivery', 'delivered'] }
        });

        res.status(200).json({
            success: true,
            data: {
                totalAssigned,
                inProgress,
                completed
            }
        });
    } catch (error) {
        console.error('Get agent stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching agent statistics'
        });
    }
};

// @desc    Get analytics for agent
// @route   GET /api/agent/analytics
// @access  Private (Agent)
exports.getAnalytics = async (req, res) => {
    try {
        const { period = '30days' } = req.query;
        const now = new Date();
        let startDate;

        switch (period) {
            case '7days': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30days': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '90days': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Tasks completed over time
        const tasksCompleted = await Order.aggregate([
            { $match: { assignedAgent: req.user._id, createdAt: { $gte: startDate }, status: { $in: ['ready_for_delivery', 'out_for_delivery', 'delivered'] } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Completion rate
        const total = await Order.countDocuments({ assignedAgent: req.user._id });
        const completed = await Order.countDocuments({ assignedAgent: req.user._id, status: { $in: ['ready_for_delivery', 'out_for_delivery', 'delivered'] } });
        const inProgress = await Order.countDocuments({ assignedAgent: req.user._id, status: 'shopping' });
        const pending = total - completed - inProgress;

        res.status(200).json({
            success: true,
            data: {
                tasks: {
                    labels: tasksCompleted.map(t => new Date(t._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    values: tasksCompleted.map(t => t.count)
                },
                rate: {
                    labels: ['Completed', 'In Progress', 'Pending'],
                    values: [completed, inProgress, pending]
                }
            }
        });
    } catch (error) {
        console.error('Get agent analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};
