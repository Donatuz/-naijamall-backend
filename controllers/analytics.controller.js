const User = require('../models/User.model');
const Order = require('../models/Order.model');

// @desc    Get analytics data for charts
// @route   GET /api/admin/analytics
// @access  Private (Admin/Super Admin)
exports.getAnalytics = async (req, res) => {
    try {
        const { period = '30days' } = req.query;

        // Calculate date range based on period
        const now = new Date();
        let startDate;

        switch (period) {
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '6months':
                startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
                startDate = new Date('2020-01-01'); // Far back date
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Get user signups data
        const signups = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get transactions/orders data
        const transactions = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get revenue data
        const revenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $in: ['delivered', 'completed'] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    total: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get users by role
        const roleDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format data for charts
        const formatChartData = (data, key = 'count') => {
            const labels = data.map(item => {
                const date = new Date(item._id);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const values = data.map(item => item[key]);
            return { labels, values };
        };

        const formatRoleData = (data) => {
            const roleLabels = {
                'buyer': 'Buyers',
                'seller': 'Sellers',
                'rider': 'Riders',
                'agent': 'Agents',
                'customer_service': 'Customer Service',
                'admin': 'Admins',
                'super_admin': 'Super Admins'
            };

            const labels = data.map(item => roleLabels[item._id] || item._id);
            const values = data.map(item => item.count);
            return { labels, values };
        };

        res.status(200).json({
            success: true,
            data: {
                signups: formatChartData(signups),
                transactions: formatChartData(transactions),
                revenue: formatChartData(revenue, 'total'),
                roles: formatRoleData(roleDistribution)
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics data'
        });
    }
};
