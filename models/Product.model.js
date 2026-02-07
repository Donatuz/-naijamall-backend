const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'piece', 'bundle', 'bag', 'liter', 'ml', 'dozen']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    images: [{
        url: String,
        publicId: String
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isFresh: {
        type: Boolean,
        default: true
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    numReviews: {
        type: Number,
        default: 0
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    tags: [String],
    // Market location
    marketLocation: {
        name: String,
        address: String,
        state: String
    },
    // Product stats
    totalSold: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    // SEO
    slug: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Create slug from name
productSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    }
    next();
});

// Calculate final price after discount
productSchema.virtual('finalPrice').get(function() {
    return this.price - (this.price * this.discount / 100);
});

// Check if product is in stock
productSchema.virtual('inStock').get(function() {
    return this.stock > 0 && this.isAvailable;
});

module.exports = mongoose.model('Product', productSchema);
