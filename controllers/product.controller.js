const Product = require('../models/Product.model');
const Category = require('../models/Category.model');

// @desc    Get all products (with filters, search, pagination)
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            seller,
            isFresh,
            isAvailable,
            sort,
            page = 1,
            limit = 12
        } = req.query;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (seller) {
            query.seller = seller;
        }

        if (isFresh !== undefined) {
            query.isFresh = isFresh === 'true';
        }

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'rating') sortOption = { rating: -1 };
        if (sort === 'popular') sortOption = { totalSold: -1 };

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const products = await Product.find(query)
            .populate('category', 'name icon')
            .populate('seller', 'firstName lastName businessName rating')
            .sort(sortOption)
            .limit(Number(limit))
            .skip(skip);

        const total = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            count: products.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page),
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name icon')
            .populate('seller', 'firstName lastName businessName rating address')
            .populate({
                path: 'reviews',
                populate: { path: 'buyer', select: 'firstName lastName avatar' }
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Increment views
        product.views += 1;
        await product.save();

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product'
        });
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Verified Sellers only)
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            unit,
            category,
            stock,
            isFresh,
            discount,
            tags,
            marketLocation
        } = req.body;

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            unit,
            category,
            seller: req.user.id,
            stock,
            isFresh,
            discount,
            tags,
            marketLocation
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating product'
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Seller - own products only)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product'
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Seller - own products only)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product'
        });
    }
};

// @desc    Get seller's products
// @route   GET /api/products/seller/my-products
// @access  Private (Seller)
exports.getMyProducts = async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user.id })
            .populate('category', 'name icon')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products'
        });
    }
};

// @desc    Toggle product availability
// @route   PATCH /api/products/:id/availability
// @access  Private (Seller)
exports.toggleAvailability = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        product.isAvailable = !product.isAvailable;
        await product.save();

        res.status(200).json({
            success: true,
            message: `Product ${product.isAvailable ? 'enabled' : 'disabled'} successfully`,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error toggling availability'
        });
    }
};
