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

// Sản phẩm mẫu: Shiina Mahiru - ID 67ef7e469f5cf73728ffbc5a
// User mẫu: Nguyễn Hoàng Tùng - ID 67ef80fecf140398d274787a