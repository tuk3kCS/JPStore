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
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        ward: String,
        district: String,
        city: String
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'PAYOS'
    },
    paymentDetails: {
        orderCode: String,
        paymentLinkId: String,
        checkoutUrl: String,
        qrCode: String,
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'CANCELLED'],
            default: 'PENDING'
        }
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    orderStatus: {
        type: String,
        required: true,
        enum: ['PENDING', 'PROCESSING', 'DELIVERING', 'CANCELLED'],
        default: 'PENDING'
    },
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
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

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