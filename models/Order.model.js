const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    shippingAddress: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: String,
        phone: {
            type: String,
            required: true
        }
    },
    // Pricing breakdown
    itemsTotal: {
        type: Number,
        required: true,
        default: 0
    },
    escrowFee: {
        type: Number,
        required: true,
        default: 500 // ₦500 per transaction
    },
    marketProcurementFee: {
        type: Number,
        required: true,
        default: 0
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    // Order status
    status: {
        type: String,
        enum: [
            'pending',
            'confirmed',
            'shopping',
            'ready_for_delivery',
            'out_for_delivery',
            'delivered',
            'cancelled',
            'refunded'
        ],
        default: 'pending'
    },
    // Payment details
    paymentStatus: {
        type: String,
        enum: ['pending', 'held_in_escrow', 'released', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
        required: true
    },
    paymentReference: String,
    escrowReleaseDate: Date,
    // Delivery details
    rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryStatus: {
        type: String,
        enum: ['not_assigned', 'assigned', 'picked_up', 'in_transit', 'delivered'],
        default: 'not_assigned'
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    // Shopping agent
    shoppingAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Customer service assignment
    customerService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Workflow tracking
    assignmentHistory: [{
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: String, // 'customer_service', 'agent', 'rider'
        timestamp: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    // Tracking
    trackingHistory: [{
        status: String,
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        location: String
    }],
    // Buyer actions
    buyerConfirmation: {
        confirmed: {
            type: Boolean,
            default: false
        },
        confirmedAt: Date,
        feedback: String
    },
    // Cancellation
    cancellationReason: String,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,
    // Notes
    buyerNotes: String,
    internalNotes: String
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `NM${timestamp}${random}`;
    }
    next();
});

// Calculate market procurement fee based on items total
orderSchema.pre('save', function(next) {
    if (this.isModified('itemsTotal')) {
        if (this.itemsTotal < 5000) {
            this.marketProcurementFee = 1500;
        } else if (this.itemsTotal < 10000) {
            this.marketProcurementFee = 2500;
        } else if (this.itemsTotal < 20000) {
            this.marketProcurementFee = 3500;
        } else {
            this.marketProcurementFee = 5000;
        }
    }
    next();
});

// Add tracking entry
orderSchema.methods.addTracking = function(status, description, location = '') {
    this.trackingHistory.push({
        status,
        description,
        location,
        timestamp: new Date()
    });
    return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
