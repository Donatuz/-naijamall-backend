const Order = require('../models/Order.model');
const Product = require('../models/Product.model');

// @desc    Get analytics for seller
// @route   GET /api/seller/analytics
// @access  Private (Seller)
exports.getAnalytics = async (req, res) => {
    try {
        const { period = '30days' } = req.query;
        const now = new Date();
        let startDate;

        switch (period) {
            case '7days': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30days': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '90days': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            case '6months': startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); break;
            case '1year': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
            default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Revenue over time
        const revenue = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate }, status: { $in: ['delivered', 'completed'] } } },
            { $unwind: '$items' },
            { $match: { 'items.seller': req.user._id } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    total: { $sum: '$items.subtotal' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Products sold over time
        const productsSold = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            { $match: { 'items.seller': req.user._id } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: '$items.quantity' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Top selling products
        const topProducts = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            { $match: { 'items.seller': req.user._id } },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ]);

        // Order status for seller's products
        const orderStatus = await Order.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.seller': req.user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                revenue: {
                    labels: revenue.map(r => new Date(r._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    values: revenue.map(r => r.total || 0)
                },
                productsSold: {
                    labels: productsSold.map(p => new Date(p._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                    values: productsSold.map(p => p.count || 0)
                },
                topProducts: {
                    labels: topProducts.map(p => p.product.name || 'Unknown'),
                    values: topProducts.map(p => p.totalSold || 0)
                },
                orderStatus: {
                    labels: orderStatus.map(s => s._id.replace(/_/g, ' ')),
                    values: orderStatus.map(s => s.count || 0)
                }
            }
        });
    } catch (error) {
        console.error('Get seller analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller analytics'
        });
    }
};
