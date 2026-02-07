const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        quantity: {
            type: Number,
            required: true
        },
        requestedPrice: Number,
        notes: String
    }],
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        phone: String
    },
    buyerNotes: String,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'assigned', 'converted', 'cancelled'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    convertedToOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    internalNotes: String,
    estimatedTotal: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
