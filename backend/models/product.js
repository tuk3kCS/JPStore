const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    description: String,
    price: {type: Number, required: true},
    image: String,
    preOrder: {type: Number, default: 0, required: true},
    releaseDate: Date,
    stock: {type: Number, default: 0}
}, {timestamp: true});

module.exports = mongoose.model('Product', productSchema);