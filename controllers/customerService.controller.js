const Order = require('../models/Order.model');
const User = require('../models/User.model');

// @desc    Get all orders for customer service view
// @route   GET /api/customer-service/orders
// @access  Private (Customer Service)
exports.getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        
        // Filter by status if provided
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName email phone')
            .populate('customerService', 'firstName lastName')
            .populate('assignedAgent', 'firstName lastName phone')
            .populate('rider', 'firstName lastName phone')
            .populate('items.product', 'name price images')
            .populate('items.seller', 'firstName lastName businessName')
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
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// @desc    Get orders assigned to current customer service
// @route   GET /api/customer-service/my-orders
// @access  Private (Customer Service)
exports.getMyOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {
            customerService: req.user._id
        };
        
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName email phone')
            .populate('assignedAgent', 'firstName lastName phone')
            .populate('rider', 'firstName lastName phone')
            .populate('items.product', 'name price images')
            .populate('items.seller', 'firstName lastName businessName')
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
            message: 'Error fetching your orders'
        });
    }
};

// @desc    Assign order to agent
// @route   POST /api/customer-service/orders/:orderId/assign-agent
// @access  Private (Customer Service)
exports.assignOrderToAgent = async (req, res) => {
    try {
        const { agentId, notes } = req.body;
        const { orderId } = req.params;

        // Verify agent exists and has agent role
        const agent = await User.findById(agentId);
        if (!agent || agent.role !== 'agent') {
            return res.status(400).json({
                success: false,
                message: 'Invalid agent ID or user is not an agent'
            });
        }

        // Get the order
        const order = await Order.findById(orderId)
            .populate('buyer', 'firstName lastName email phone')
            .populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Assign the order
        order.assignedAgent = agentId;
        order.customerService = req.user._id;
        
        // Add to assignment history
        order.assignmentHistory.push({
            assignedBy: req.user._id,
            assignedTo: agentId,
            role: 'agent',
            notes: notes || `Assigned to agent for market procurement`,
            timestamp: new Date()
        });

        // Update order status
        if (order.status === 'pending' || order.status === 'confirmed') {
            order.status = 'shopping';
        }

        // Add tracking
        await order.addTracking(
            'shopping',
            `Order assigned to agent ${agent.firstName} ${agent.lastName} for market procurement`,
            ''
        );

        await order.save();

        res.status(200).json({
            success: true,
            message: `Order successfully assigned to agent ${agent.firstName} ${agent.lastName}`,
            data: order
        });
    } catch (error) {
        console.error('Assign agent error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning order to agent'
        });
    }
};

// @desc    Get available agents
// @route   GET /api/customer-service/agents
// @access  Private (Customer Service)
exports.getAvailableAgents = async (req, res) => {
    try {
        const agents = await User.find({
            role: 'agent',
            isActive: true
        }).select('firstName lastName phone email');

        res.status(200).json({
            success: true,
            count: agents.length,
            data: agents
        });
    } catch (error) {
        console.error('Get agents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching agents'
        });
    }
};

// @desc    Get single order details
// @route   GET /api/customer-service/orders/:orderId
// @access  Private (Customer Service)
exports.getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('buyer', 'firstName lastName email phone address')
            .populate('customerService', 'firstName lastName email phone')
            .populate('assignedAgent', 'firstName lastName email phone')
            .populate('rider', 'firstName lastName email phone vehicleType')
            .populate('items.product', 'name price images description')
            .populate('items.seller', 'firstName lastName businessName phone');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
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

// @desc    Update order notes
// @route   PATCH /api/customer-service/orders/:orderId/notes
// @access  Private (Customer Service)
exports.updateOrderNotes = async (req, res) => {
    try {
        const { internalNotes } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { internalNotes },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notes updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notes'
        });
    }
};

// @desc    Get analytics for customer service
// @route   GET /api/customer-service/analytics
// @access  Private (Customer Service)
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

        // Orders handled by this CS or all CS
        const ordersHandled = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Orders by status
        const ordersByStatus = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                orders: {
                    labels: ordersHandled.map(o => new Date(o._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    values: ordersHandled.map(o => o.count)
                },
                status: {
                    labels: ordersByStatus.map(o => o._id.replace(/_/g, ' ')),
                    values: ordersByStatus.map(o => o.count)
                }
            }
        });
    } catch (error) {
        console.error('Get CS analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};
