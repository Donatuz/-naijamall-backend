const User = require('../models/User.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const Payment = require('../models/Payment.model');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();
        const totalBuyers = await User.countDocuments({ role: 'buyer' });
        const totalSellers = await User.countDocuments({ role: 'seller' });
        const totalRiders = await User.countDocuments({ role: 'rider' });
        const pendingSellers = await User.countDocuments({ 
            role: 'seller', 
            verificationStatus: 'pending' 
        });

        // Product statistics
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ isAvailable: true });

        // Order statistics
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const completedOrders = await Order.countDocuments({ status: 'delivered' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        // Revenue statistics
        const revenueData = await Order.aggregate([
            { $match: { paymentStatus: 'released' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    escrowFees: { $sum: '$escrowFee' },
                    procurementFees: { $sum: '$marketProcurementFee' },
                    deliveryFees: { $sum: '$deliveryFee' }
                }
            }
        ]);

        const revenue = revenueData[0] || {
            totalRevenue: 0,
            escrowFees: 0,
            procurementFees: 0,
            deliveryFees: 0
        };

        // Recent orders
        const recentOrders = await Order.find()
            .populate('buyer', 'firstName lastName')
            .sort('-createdAt')
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    buyers: totalBuyers,
                    sellers: totalSellers,
                    riders: totalRiders,
                    pendingSellers
                },
                products: {
                    total: totalProducts,
                    active: activeProducts
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    completed: completedOrders,
                    cancelled: cancelledOrders
                },
                revenue,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics'
        });
    }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;

        const query = {};

        if (role) {
            query.role = role;
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .select('-password')
            .sort('-createdAt')
            .limit(Number(limit))
            .skip(skip);

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// @desc    Update user status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status'
        });
    }
};

// @desc    Verify seller
// @route   POST /api/admin/sellers/:id/verify
// @access  Private (Admin)
exports.verifySeller = async (req, res) => {
    try {
        const { status, reason } = req.body; // status: 'verified' or 'rejected'

        const seller = await User.findById(req.params.id);

        if (!seller || seller.role !== 'seller') {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        seller.verificationStatus = status;
        await seller.save();

        // TODO: Send email notification to seller

        res.status(200).json({
            success: true,
            message: `Seller ${status} successfully`,
            data: seller
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying seller'
        });
    }
};

// @desc    Get all orders (admin view)
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('buyer', 'firstName lastName email phone')
            .populate('rider', 'firstName lastName phone')
            .populate('items.product', 'name')
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
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        });
    }
};

// @desc    Get revenue reports
// @route   GET /api/admin/revenue
// @access  Private (Admin)
exports.getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const matchQuery = { paymentStatus: 'released' };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        // Overall revenue
        const totalRevenue = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    escrowFees: { $sum: '$escrowFee' },
                    procurementFees: { $sum: '$marketProcurementFee' },
                    deliveryFees: { $sum: '$deliveryFee' },
                    itemsTotal: { $sum: '$itemsTotal' }
                }
            }
        ]);

        // Revenue by day (for charts)
        const dailyRevenue = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: totalRevenue[0] || {},
                daily: dailyRevenue
            }
        });
    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating revenue report'
        });
    }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Role hierarchy for permission checking
        const roleHierarchy = {
            super_admin: 7,
            admin: 6,
            customer_service: 5,
            agent: 4,
            seller: 3,
            rider: 2,
            buyer: 1
        };

        const targetUserLevel = roleHierarchy[user.role] || 0;
        const currentUserLevel = roleHierarchy[req.user.role] || 0;

        // Prevent deleting users with equal or higher role
        if (targetUserLevel >= currentUserLevel) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete users with equal or higher privileges'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

// @desc    Update user role (super admin only)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Super Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate role
        const validRoles = ['buyer', 'seller', 'rider', 'agent', 'customer_service', 'admin', 'super_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
            });
        }

        // Role hierarchy for permission checking
        const roleHierarchy = {
            super_admin: 7,
            admin: 6,
            customer_service: 5,
            agent: 4,
            seller: 3,
            rider: 2,
            buyer: 1
        };

        const currentUserLevel = roleHierarchy[req.user.role] || 0;
        const targetUserLevel = roleHierarchy[targetUser.role] || 0;
        const newRoleLevel = roleHierarchy[role] || 0;

        // Only super admin can create other super admins
        if (role === 'super_admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admins can create other super admins'
            });
        }

        // Regular admins can only modify roles below their level
        if (req.user.role !== 'super_admin') {
            if (targetUserLevel >= currentUserLevel || newRoleLevel >= currentUserLevel) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only modify users with lower privileges than yours'
                });
            }
        }

        // Prevent modifying own role (except super admin)
        if (targetUser._id.toString() === req.user._id.toString() && req.user.role !== 'super_admin') {
            return res.status(400).json({
                success: false,
                message: 'You cannot modify your own role'
            });
        }

        const oldRole = targetUser.role;
        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({
            success: true,
            message: `User role updated from ${oldRole} to ${role}`,
            data: targetUser
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user role'
        });
    }
};

// @desc    Get all available roles
// @route   GET /api/admin/roles
// @access  Private (Admin)
exports.getRoles = async (req, res) => {
    try {
        const roles = [
            {
                value: 'buyer',
                label: 'Buyer',
                description: 'Regular customer who can purchase products',
                level: 1
            },
            {
                value: 'rider',
                label: 'Rider/Driver',
                description: 'Delivery personnel',
                level: 2
            },
            {
                value: 'seller',
                label: 'Seller',
                description: 'Merchant who can sell products',
                level: 3
            },
            {
                value: 'agent',
                label: 'Agent',
                description: 'Sales agent with limited admin access',
                level: 4
            },
            {
                value: 'customer_service',
                label: 'Customer Service',
                description: 'Support staff with order and customer management access',
                level: 5
            },
            {
                value: 'admin',
                label: 'Admin',
                description: 'Full administrative access except role management',
                level: 6
            },
            {
                value: 'super_admin',
                label: 'Super Admin',
                description: 'Complete system access including role management',
                level: 7
            }
        ];

        // Filter roles based on current user's level
        const roleHierarchy = {
            super_admin: 7,
            admin: 6,
            customer_service: 5,
            agent: 4,
            seller: 3,
            rider: 2,
            buyer: 1
        };

        const currentUserLevel = roleHierarchy[req.user.role] || 0;
        
        // Show only roles below or equal to current user's level
        const availableRoles = roles.filter(role => {
            if (req.user.role === 'super_admin') {
                return true; // Super admin can see all roles
            }
            return role.level < currentUserLevel;
        });

        res.status(200).json({
            success: true,
            data: availableRoles,
            currentUserRole: req.user.role,
            currentUserLevel
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching roles'
        });
    }
};
