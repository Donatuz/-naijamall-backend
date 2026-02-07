const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewType: {
        type: String,
        enum: ['product', 'seller', 'rider'],
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    images: [String],
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    },
    helpful: {
        type: Number,
        default: 0
    },
    notHelpful: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Ensure one review per order per product/seller/rider
reviewSchema.index({ buyer: 1, order: 1, reviewType: 1, product: 1, seller: 1, rider: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
