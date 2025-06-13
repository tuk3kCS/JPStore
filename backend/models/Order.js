const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({
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
    items: [orderItemSchema],
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
    // PayOS payment details
    paymentLinkId: String,
    status: {
        type: String,
        required: true,
        enum: ['confirmed', 'processing', 'delivering', 'delivered', 'cancelled'],
        default: 'confirmed'
    },
    paidAt: Date,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
    return ['pending', 'processing'].includes(this.orderStatus);
};

// Method to cancel order
orderSchema.methods.cancel = function(reason) {
    if (!this.canBeCancelled()) {
        throw new Error('Order cannot be cancelled in its current state');
    }
    this.orderStatus = 'cancelled';
    this.cancelledAt = Date.now();
    this.cancellationReason = reason;
};

// Method to mark order as delivered
orderSchema.methods.markAsDelivered = function() {
    if (this.orderStatus !== 'shipped') {
        throw new Error('Order must be shipped before marking as delivered');
    }
    this.orderStatus = 'delivered';
    this.deliveredAt = Date.now();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 