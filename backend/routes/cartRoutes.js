const express = require('express');
const Cart = require('../models/cart');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Get user's cart (with JWT authorization)
router.get('/', authMiddleware, async (req, res) => {
    const cart = await Cart.findOne({userId: req.user.userId}).populate('items.productId');
    res.json(cart);
});

// Add product to cart (with JWT authorization)
router.post('/', authMiddleware, async (req, res) => {
    const {userId, productId, quantity} = req.body;

    let cart = await Cart.findOne({userId});

    if (!cart) {
        cart = new Cart({userId, items: [{productId, quantity}]});
    }
    else {
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) cart.items[itemIndex].quantity += quantity;
        else cart.items.push({productId, quantity});
    }

    await cart.save();
    res.json({message: "This product has been added to cart", cart});
});

// Remove product from cart
router.delete('/:userId/:productId', async (req, res) => {
    const {userId, productId} = req.params;
    const cart = await Cart.findOne({userId});

    if (cart) {
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        res.json({message: "This product has been removed from cart"});
    }
    else res.status(404).json({message: "Cart not found"});
});

module.exports = router;