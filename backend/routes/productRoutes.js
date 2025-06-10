const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const Category = require('../models/Category');
const { uploadProductImages } = require('../middlewares/upload');
const path = require('path');
const fs = require('fs');
const Brand = require('../models/Brand');

// Upload product images (admin only)
router.post('/upload-images', auth, uploadProductImages.array('images', 10), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Check minimum number of images (at least 5)
        if (req.files.length < 5) {
            // Delete uploaded files since validation failed
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../public/images/product', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            return res.status(400).json({ message: 'At least 5 images are required' });
        }

        // Construct image URLs
        const imageUrls = req.files.map(file => `/images/product/${file.filename}`);

        res.json({
            message: 'Product images uploaded successfully',
            images: imageUrls
        });
    } catch (error) {
        // Delete uploaded files if there was an error
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../public/images/product', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        res.status(500).json({ message: 'Error uploading product images', error: error.message });
    }
});

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
        if (category) {
            // Support multiple categories (comma-separated)
            const categoryIds = category.split(',').filter(id => id.trim());
            if (categoryIds.length > 0) {
                query.category = { $in: categoryIds };
            }
        }
        
        // Add brand filter support
        const brand = req.query.brand;
        if (brand) {
            // Support multiple brands (comma-separated)
            const brandIds = brand.split(',').filter(id => id.trim());
            if (brandIds.length > 0) {
                query.brand = { $in: brandIds };
            }
        }
        
        if (minPrice || maxPrice) {
            const priceQuery = {};
            if (minPrice) priceQuery.$gte = minPrice;
            if (maxPrice) priceQuery.$lte = maxPrice;
            
            // Support both vndPrice and jpyPrice
            query.$or = [
                { vndPrice: priceQuery },
                { jpyPrice: priceQuery }
            ];
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
            .populate('brand', 'name description')
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
            .populate('category', 'name description')
            .populate('brand', 'name description');
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

        // Check if brand exists
        const brand = await Brand.findById(req.body.brand);
        if (!brand) {
            return res.status(400).json({ message: 'Brand not found' });
        }

        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            vndPrice: req.body.vndPrice,
            jpyPrice: req.body.jpyPrice,
            category: req.body.category,
            brand: req.body.brand,
            images: req.body.images,
            stock: req.body.stock,
            isPreOrder: req.body.isPreOrder || false,
            releaseDate: req.body.releaseDate || null
        });

        const savedProduct = await product.save();
        const populatedProduct = await Product.findById(savedProduct._id)
            .populate('category', 'name description')
            .populate('brand', 'name description');
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

        // Check if brand exists if it's being updated
        if (req.body.brand) {
            const brand = await Brand.findById(req.body.brand);
            if (!brand) {
                return res.status(400).json({ message: 'Brand not found' });
            }
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product fields
        product.name = req.body.name || product.name;
        product.description = req.body.description || product.description;
        product.vndPrice = req.body.vndPrice || product.vndPrice;
        product.jpyPrice = req.body.jpyPrice || product.jpyPrice;
        product.category = req.body.category || product.category;
        product.brand = req.body.brand || product.brand;
        product.images = req.body.images || product.images;
        product.stock = req.body.stock || product.stock;
        product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;
        product.isPreOrder = req.body.isPreOrder !== undefined ? req.body.isPreOrder : product.isPreOrder;
        product.releaseDate = req.body.releaseDate !== undefined ? req.body.releaseDate : product.releaseDate;

        const updatedProduct = await product.save();
        const populatedProduct = await Product.findById(updatedProduct._id)
            .populate('category', 'name description')
            .populate('brand', 'name description');
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