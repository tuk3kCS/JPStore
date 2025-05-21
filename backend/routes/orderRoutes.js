const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const payosService = require('../services/payosService');

// Create order and payment link
router.post('/checkout', auth, async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Check product stock
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);
            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    message: `Not enough stock for product: ${product.name}`,
                    product: product.name,
                    available: product.stock
                });
            }
        }

        // Generate order code
        const orderCode = Date.now().toString();

        // Create order items
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.price
        }));

        // Create order
        const order = new Order({
            user: req.user.userId,
            items: orderItems,
            total: cart.total,
            shippingAddress,
            paymentMethod: 'PAYOS',
            paymentStatus: 'PENDING',
            orderStatus: 'PENDING'
        });

        // Create payment link
        const paymentData = {
            orderCode,
            amount: cart.total,
            description: `Order #${orderCode}`,
            items: cart.items.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price
            })),
            returnUrl: `${process.env.FRONTEND_URL}/order/success/${orderCode}`,
            cancelUrl: `${process.env.FRONTEND_URL}/order/cancel/${orderCode}`
        };

        console.log('Creating payment link with data:', paymentData);

        let paymentResponse;
        try {
            paymentResponse = await payosService.createPaymentLink(paymentData);
            console.log('Payment link created:', paymentResponse);
        } catch (error) {
            console.error('Error creating payment link:', error);
            return res.status(500).json({ 
                message: 'Error creating payment link', 
                error: error.message,
                details: error.response?.data || 'No additional details'
            });
        }

        // Update order with payment details
        order.paymentDetails = {
            orderCode,
            paymentLinkId: paymentResponse.paymentLinkId,
            checkoutUrl: paymentResponse.checkoutUrl,
            qrCode: paymentResponse.qrCode,
            status: 'PENDING'
        };

        // Save order
        await order.save();

        res.status(201).json({
            message: 'Order created successfully',
            order,
            payment: {
                checkoutUrl: paymentResponse.checkoutUrl,
                qrCode: paymentResponse.qrCode
            }
        });
    } catch (error) {
        console.error('Error in checkout:', error);
        res.status(500).json({ 
            message: 'Error processing order', 
            error: error.message,
            details: error.response?.data || 'No additional details'
        });
    }
});

// Webhook to handle payment status updates
router.post('/webhook', async (req, res) => {
    try {
        const { orderCode, status } = req.body;

        const order = await Order.findOne({ 'paymentDetails.orderCode': orderCode });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update order status based on payment status
        if (status === 'PAID') {
            order.paymentStatus = 'PAID';
            order.orderStatus = 'PROCESSING';
            order.paymentDetails.status = 'PAID';
            
            // Clear the cart only after successful payment
            await Cart.findOneAndUpdate(
                { user: order.user },
                { $set: { items: [], total: 0 } }
            );
        } else if (status === 'CANCELLED') {
            order.paymentStatus = 'FAILED';
            order.orderStatus = 'CANCELLED';
            order.paymentDetails.status = 'CANCELLED';
        }

        await order.save();
        res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error processing webhook', error: error.message });
    }
});

// Get order status
router.get('/:orderCode/status', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ 
            'paymentDetails.orderCode': req.params.orderCode,
            user: req.user.userId 
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentDetails: order.paymentDetails
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order status', error: error.message });
    }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.user.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
});

// Get all orders for authenticated user
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
});

// Update order status (admin only)
router.put('/:id/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.orderStatus = status;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status', error: error.message });
    }
});

// Get all orders (admin only)
router.get('/', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 10, status, paymentStatus } = req.query;
        
        const query = {};
        if (status) query.orderStatus = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        const orders = await Order.find(query)
            .populate('items.product')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// Update order status to PROCESSING (for payment success)
router.post('/update-status/:orderId/success', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.orderStatus = 'PROCESSING';
        order.paymentStatus = 'PAID';
        order.paymentDetails.status = 'PAID';
        await order.save();
        res.json({ message: 'Order updated to PROCESSING' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});

// Update order status to CANCELLED (for payment cancel)
router.post('/update-status/:orderId/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.orderStatus = 'CANCELLED';
        order.paymentStatus = 'FAILED';
        order.paymentDetails.status = 'CANCELLED';
        await order.save();
        res.json({ message: 'Order updated to CANCELLED' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});

// Update order status to PROCESSING (for payment success) by orderCode
router.post('/update-status-by-code/:orderCode/success', async (req, res) => {
    try {
        const order = await Order.findOne({ 'paymentDetails.orderCode': req.params.orderCode });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.orderStatus = 'PROCESSING';
        order.paymentStatus = 'PAID';
        order.paymentDetails.status = 'PAID';
        await order.save();
        // Delete the cart after successful payment
        await Cart.findOneAndDelete({ user: order.user });
        res.json({ message: 'Order updated to PROCESSING' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});

// Update order status to CANCELLED (for payment cancel) by orderCode
router.post('/update-status-by-code/:orderCode/cancel', async (req, res) => {
    try {
        const order = await Order.findOne({ 'paymentDetails.orderCode': req.params.orderCode });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.orderStatus = 'CANCELLED';
        order.paymentStatus = 'FAILED';
        order.paymentDetails.status = 'CANCELLED';
        await order.save();
        res.json({ message: 'Order updated to CANCELLED' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});

// Get order by orderCode
router.get('/by-code/:orderCode', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ 'paymentDetails.orderCode': req.params.orderCode });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get order', error: error.message });
    }
});

module.exports = router; 