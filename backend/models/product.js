const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Product category is required']
    },
    brand: {
        type: String,
        required: [true, 'Product brand is required'],
        trim: true
    },
    images: [{
        type: String,
        required: [true, 'At least one product image is required']
    }],
    stock: {
        type: Number,
        required: [true, 'Product stock is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    isPreOrder: {
        type: Boolean,
        default: false,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
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

const Product = mongoose.model('Product', productSchema);
module.exports = Product;