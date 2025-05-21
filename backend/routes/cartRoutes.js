const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.userId })
            .populate('items.product', 'name price images');
        
        if (!cart) {
            return res.json({ items: [], total: 0 });
        }
        
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if product is in stock
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Find or create user's cart
        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) {
            cart = new Cart({
                user: req.user.userId,
                items: []
            });
        }

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
                price: product.price
            });
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price images');

        res.status(201).json(populatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding item to cart', error: error.message });
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
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if product is in stock
        if (product.stock < quantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Find user's cart
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find and update the item
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        item.quantity = quantity;
        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price images');

        res.json(populatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart item', error: error.message });
    }
});

// Remove item from cart
router.delete('/items/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;

        // Find user's cart
        const cart = await Cart.findOne({ user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Remove the item
        cart.items = cart.items.filter(item => item.product.toString() !== productId);
        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price images');

        res.json(populatedCart);
    } catch (error) {
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({ user: req.user.userId });
        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart', error: error.message });
    }
});

module.exports = router; 