const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');
const exchangeRateService = require('../services/exchangeRateService');

// Helper function to load exchange rate settings
const loadExchangeRateSettings = async () => {
    try {
        const settingsPath = path.join(__dirname, '../config/exchangeRateSettings.json');
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(data);
            return settings;
        } else {
            // Try to fetch current exchange rate from API
            try {
                const apiRate = await exchangeRateService.fetchExchangeRate();
                const configDir = path.dirname(settingsPath);
                if (!fs.existsSync(configDir)) {
                    fs.mkdirSync(configDir, { recursive: true });
                }
                
                const defaultSettings = {
                    type: 'automatic',
                    rate: apiRate.toString(),
                    lastSaved: new Date().toISOString()
                };
                
                fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
                console.log('Tạo cấu hình tỷ giá mặc định với tỷ giá từ API:', defaultSettings.rate);
                return defaultSettings;
            } catch (apiError) {
                console.error('Lỗi lấy tỷ giá từ API:', apiError);
                // If API fails, return null to indicate no settings available
                // This will cause the calculateItemPrice to handle the fallback differently
                return null;
            }
        }
    } catch (error) {
        console.error('Lỗi tải cấu hình tỷ giá:', error);
    }
    return null;
};

// Helper function to calculate item price with exchange rate
const calculateItemPrice = async (product) => {
    if (product.isPreOrder) {
        // For pre-order products, calculate VND price from JPY price × exchange rate
        if (product.jpyPrice) {
            const settings = await loadExchangeRateSettings();
            if (settings && settings.rate) {
                const exchangeRate = parseFloat(settings.rate);
                if (exchangeRate > 0) {
                    return Math.round(product.jpyPrice * exchangeRate);
                }
            }
            
            // If no settings available, try to fetch from API directly
            try {
                const apiRate = await exchangeRateService.fetchExchangeRate();
                console.log('Using live exchange rate for calculation:', apiRate);
                return Math.round(product.jpyPrice * apiRate);
            } catch (apiError) {
                console.error('Failed to fetch exchange rate from API for price calculation:', apiError);
                // If API also fails, return 0 to indicate price calculation failed
                // This prevents showing incorrect prices
                return 0;
            }
        }
        // Fallback to stored VND price if no JPY price
        return product.vndPrice || 0;
    } else {
        return product.vndPrice || product.price || 0;
    }
};

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId })
            .populate('items.product', 'name price vndPrice jpyPrice images isPreOrder stock brand category');
        
        if (!cart) {
            return res.json({ items: [], total: 0, totalItems: 0, subtotal: 0 });
        }
        
        // Calculate totals with async price calculation
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate prices for all items in parallel
        const itemPrices = await Promise.all(cart.items.map(item => calculateItemPrice(item.product)));
        const subtotal = cart.items.reduce((sum, item, index) => {
            return sum + (itemPrices[index] * item.quantity);
        }, 0);
        const total = subtotal;
        
        res.json({
            ...cart.toObject(),
            totalItems,
            subtotal,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy giỏ hàng', error: error.message });
    }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Check if product is in stock (skip for pre-orders)
        if (!product.isPreOrder && product.stock < quantity) {
            return res.status(400).json({ message: 'Không đủ hàng trong kho' });
        }

        // Find or create user's cart
        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) {
            cart = new Cart({
                user: req.user.userId,
                items: []
            });
        }

        // Determine the price to use
        const itemPrice = await calculateItemPrice(product);

        // Check if product already exists in cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            // Update quantity if product exists
            existingItem.quantity += quantity;
        } else {
            // Add new item if product doesn't exist
            cart.items.push({
                product: productId,
                quantity: quantity,
                price: itemPrice
            });
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price vndPrice jpyPrice images isPreOrder stock brand category');

        // Calculate totals for response with async price calculation
        const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate prices for all items in parallel
        const itemPrices = await Promise.all(populatedCart.items.map(item => calculateItemPrice(item.product)));
        const subtotal = populatedCart.items.reduce((sum, item, index) => {
            return sum + (itemPrices[index] * item.quantity);
        }, 0);
        const total = subtotal;

        res.status(201).json({
            ...populatedCart.toObject(),
            totalItems,
            subtotal,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thêm sản phẩm vào giỏ hàng', error: error.message });
    }
});

// Update cart item quantity
router.put('/items/:productId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
        }

        // Check if product is in stock (skip for pre-orders)
        if (!product.isPreOrder && product.stock < quantity) {
            return res.status(400).json({ message: 'Không đủ hàng trong kho' });
        }

        // Find user's cart
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }

        // Find and update the item
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại trong giỏ hàng' });
        }

        item.quantity = quantity;
        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price vndPrice jpyPrice images isPreOrder stock brand category');

        // Calculate totals for response with async price calculation
        const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate prices for all items in parallel
        const itemPrices = await Promise.all(populatedCart.items.map(item => calculateItemPrice(item.product)));
        const subtotal = populatedCart.items.reduce((sum, item, index) => {
            return sum + (itemPrices[index] * item.quantity);
        }, 0);
        const total = subtotal;

        res.json({
            ...populatedCart.toObject(),
            totalItems,
            subtotal,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật sản phẩm trong giỏ hàng', error: error.message });
    }
});

// Remove item from cart
router.delete('/items/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;

        // Find user's cart
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }

        // Remove the item
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price vndPrice jpyPrice images isPreOrder stock brand category');

        // Calculate totals for response with async price calculation
        const totalItems = populatedCart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Calculate prices for all items in parallel
        const itemPrices = await Promise.all(populatedCart.items.map(item => calculateItemPrice(item.product)));
        const subtotal = populatedCart.items.reduce((sum, item, index) => {
            return sum + (itemPrices[index] * item.quantity);
        }, 0);
        const total = subtotal;

        res.json({
            ...populatedCart.toObject(),
            totalItems,
            subtotal,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa sản phẩm khỏi giỏ hàng', error: error.message });
    }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({ user: req.user.userId });
        res.json({ message: 'Giỏ hàng đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa giỏ hàng', error: error.message });
    }
});

module.exports = router; 