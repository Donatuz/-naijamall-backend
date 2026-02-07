const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'bank_transfer', 'ussd', 'mobile_money'],
        required: true
    },
    paymentGateway: {
        type: String,
        enum: ['paystack', 'flutterwave', 'manual'],
        default: 'paystack'
    },
    // Payment references
    reference: {
        type: String,
        required: true,
        unique: true
    },
    gatewayReference: String,
    transactionId: String,
    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'held_in_escrow', 'released', 'failed', 'refunded'],
        default: 'pending'
    },
    // Escrow details
    escrowStatus: {
        type: String,
        enum: ['not_started', 'held', 'released_to_sellers', 'refunded_to_buyer'],
        default: 'not_started'
    },
    escrowHeldAt: Date,
    escrowReleasedAt: Date,
    escrowReleaseReason: String,
    // Breakdown of payment distribution
    distribution: [{
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        recipientType: {
            type: String,
            enum: ['seller', 'rider', 'platform']
        },
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        paidAt: Date,
        failureReason: String
    }],
    // Platform fees
    fees: {
        escrowFee: {
            type: Number,
            default: 500
        },
        marketProcurementFee: Number,
        sellerCommission: Number, // 5% of items total
        riderFee: Number, // 10% of delivery fee
        platformTotal: Number
    },
    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        cardType: String,
        cardLast4: String,
        bank: String
    },
    // Refund details
    refund: {
        amount: Number,
        reason: String,
        refundedAt: Date,
        refundReference: String
    },
    // Failure details
    failureReason: String,
    failedAt: Date,
    // Gateway response
    gatewayResponse: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Generate payment reference
paymentSchema.pre('save', async function(next) {
    if (!this.reference) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.reference = `PAY-${timestamp}-${random}`;
    }
    next();
});

// Calculate platform fees
paymentSchema.methods.calculateFees = function(itemsTotal, deliveryFee) {
    this.fees.sellerCommission = itemsTotal * 0.05; // 5%
    this.fees.riderFee = deliveryFee * 0.10; // 10%
    this.fees.platformTotal = this.fees.escrowFee + 
                              this.fees.marketProcurementFee + 
                              this.fees.sellerCommission + 
                              this.fees.riderFee;
    return this.fees;
};

module.exports = mongoose.model('Payment', paymentSchema);
