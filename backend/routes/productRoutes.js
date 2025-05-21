const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const Category = require('../models/Category');

// Get all products with pagination and filters
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sort = req.query.sort || '-createdAt';
        const category = req.query.category;
        const search = req.query.search;
        const minPrice = req.query.minPrice;
        const maxPrice = req.query.maxPrice;

        let query = { isActive: true };

        // Apply filters
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name description')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
});

// Create new product (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Check if category exists
        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(400).json({ message: 'Category not found' });
        }

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            brand: req.body.brand,
            images: req.body.images,
            stock: req.body.stock
        });

        const savedProduct = await product.save();
        const populatedProduct = await Product.findById(savedProduct._id)
            .populate('category', 'name description');
        res.status(201).json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
});

// Update product (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Check if category exists if it's being updated
        if (req.body.category) {
            const category = await Category.findById(req.body.category);
            if (!category) {
                return res.status(400).json({ message: 'Category not found' });
            }
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product fields
        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.price = req.body.price || product.price;
        product.category = req.body.category || product.category;
        product.brand = req.body.brand || product.brand;
        product.images = req.body.images || product.images;
        product.stock = req.body.stock || product.stock;
        product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;

        const updatedProduct = await product.save();
        const populatedProduct = await Product.findById(updatedProduct._id)
            .populate('category', 'name description');
        res.json(populatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
});

// Delete product (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router; 