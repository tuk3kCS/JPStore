const mongoose = require('mongoose');

const paymentIntentItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: [String]
});

const paymentIntentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderCode: {
        type: Number,
        required: true,
        unique: true
    },
    items: [paymentIntentItemSchema],
    total: {
        type: Number,
        required: true
    },
    customerInfo: {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'payos'
    },
    paymentLinkId: String,
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Expire after 1 day
    }
}, {
    timestamps: true
});

// Add indexes
paymentIntentSchema.index({ user: 1, createdAt: -1 });
paymentIntentSchema.index({ orderCode: 1 });
paymentIntentSchema.index({ status: 1 });

const PaymentIntent = mongoose.model('PaymentIntent', paymentIntentSchema);

module.exports = PaymentIntent; 