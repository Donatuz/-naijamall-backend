const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const Product = require('../models/Product.model');
const User = require('../models/User.model');

// @desc    Upload product images
// @route   POST /api/products/:id/upload-images
// @access  Private (Seller)
exports.uploadProductImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please upload at least one image'
            });
        }

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
                message: 'Not authorized to upload images for this product'
            });
        }

        // Upload images to Cloudinary
        const uploadPromises = req.files.map(file => 
            uploadToCloudinary(file.buffer, 'naijamall/products')
        );

        const uploadedImages = await Promise.all(uploadPromises);

        // Add images to product
        product.images = [...product.images, ...uploadedImages];
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Images uploaded successfully',
            data: product.images
        });
    } catch (error) {
        console.error('Upload images error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading images'
        });
    }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:publicId
// @access  Private (Seller)
exports.deleteProductImage = async (req, res) => {
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

        const { publicId } = req.params;

        // Remove from Cloudinary
        await deleteFromCloudinary(publicId);

        // Remove from product
        product.images = product.images.filter(img => img.publicId !== publicId);
        await product.save();

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting image'
        });
    }
};

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'naijamall/avatars');

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: result.url },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading avatar'
        });
    }
};
