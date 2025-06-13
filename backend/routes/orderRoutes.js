const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const PaymentIntent = require('../models/PaymentIntent');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const payosService = require('../services/payosService');
const exchangeRateService = require('../services/exchangeRateService');

// Helper function to update product quantities after successful payment
const updateProductQuantities = async (orderItems) => {
    try {
        console.log('Updating product quantities for order items:', orderItems.length);
        
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                console.warn(`Product not found: ${item.product}`);
                continue;
            }

            // Only update stock for non-preorder products
            if (!product.isPreOrder) {
                const oldStock = product.stock;
                
                // Check if there's enough stock before reducing
                if (product.stock < item.quantity) {
                    console.warn(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                    // Reduce by available stock only
                    product.stock = 0;
                } else {
                    product.stock = product.stock - item.quantity;
                }
                
                await product.save();
                
                console.log(`Updated ${product.name}: ${oldStock} -> ${product.stock} (reduced by ${Math.min(item.quantity, oldStock)})`);
                
                // Log warning if stock went to zero
                if (product.stock === 0) {
                    console.warn(`Product ${product.name} is now out of stock!`);
                }
            } else {
                console.log(`Skipped pre-order product: ${product.name}`);
            }
        }
    } catch (error) {
        console.error('Error updating product quantities:', error);
        // Don't throw error here to avoid breaking order creation
    }
};

// Helper function to calculate item price with live exchange rate
const calculateItemPrice = async (product) => {
    if (product.isPreOrder && product.jpyPrice) {
        try {
            const exchangeRate = await exchangeRateService.fetchExchangeRate();
            return Math.round(product.jpyPrice * exchangeRate);
        } catch (error) {
            console.error('Failed to fetch exchange rate for order calculation:', error);
            // If API fails, return 0 to prevent incorrect pricing
            return 0;
        }
    } else {
        return product.vndPrice || product.price || 0;
    }
};

// Create payment intent with PayOS payment (order saved only after payment success)
router.post('/', auth, async (req, res) => {
    try {
        const { customerInfo, paymentMethod = 'payos' } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user.userId })
            .populate('items.product', 'name price vndPrice jpyPrice images isPreOrder stock');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }

        // Validate stock availability for non-preorder items
        for (const item of cart.items) {
            if (!item.product.isPreOrder) {
                if (item.product.stock < item.quantity) {
                return res.status(400).json({ 
                        message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`,
                        productName: item.product.name,
                        available: item.product.stock,
                        requested: item.quantity
                    });
                }
            }
        }

        // Calculate total from cart with live exchange rates
        let cartTotal = 0;
        const itemPrices = await Promise.all(cart.items.map(item => calculateItemPrice(item.product)));
        cartTotal = cart.items.reduce((sum, item, index) => {
            return sum + (itemPrices[index] * item.quantity);
        }, 0);

        // Generate unique order code
        const orderCode = Date.now();

        // Prepare payment intent data with calculated prices
        const paymentIntentData = {
            user: req.user.userId,
            orderCode: orderCode,
            items: await Promise.all(cart.items.map(async (item, index) => ({
                product: item.product._id,
                name: item.product.name,
                price: itemPrices[index],
                quantity: item.quantity,
                images: item.product.images
            }))),
            customerInfo: {
                fullName: customerInfo.fullName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: customerInfo.address
            },
            total: cartTotal,
            paymentMethod: paymentMethod,
            status: 'pending'
        };

        // Create payment intent (not order yet)
        const paymentIntent = new PaymentIntent(paymentIntentData);
        await paymentIntent.save();
        
        console.log(`PaymentIntent created for orderCode: ${orderCode}`);

        // If payment method is PayOS, create payment link
        if (paymentMethod === 'payos') {
            try {
                // Prepare PayOS data according to API documentation
                const payosData = {
                    orderCode: orderCode,
                    amount: Math.round(cartTotal), // Ensure integer amount
                    description: `Order #${orderCode}`,
                    items: cart.items.map((item, index) => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: Math.round(itemPrices[index])
                    })),
                    returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?orderCode=${orderCode}`,
                    cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`
                };

                console.log('Creating PayOS payment with data:', payosData);

                // Create payment link using PayOS service
                const paymentResult = await payosService.createPaymentLink(payosData);

                // Update payment intent with payment link information
                paymentIntent.paymentLinkId = paymentResult.paymentLinkId;
                await paymentIntent.save();

                // Return payment intent with payment URL
                res.status(201).json({
                    message: 'Thanh toán đã được khởi tạo thành công',
                    paymentIntent: {
                        _id: paymentIntent._id,
                        orderCode: paymentIntent.orderCode,
                        total: paymentIntent.total,
                        status: paymentIntent.status
                    },
                    payment: {
                        checkoutUrl: paymentResult.checkoutUrl
                    }
                });

            } catch (paymentError) {
                console.error('PayOS payment creation failed:', paymentError);
                
                // Update payment intent status to failed
                paymentIntent.status = 'failed';
                await paymentIntent.save();

            return res.status(500).json({ 
                    message: 'Thiết lập thanh toán thất bại',
                    error: paymentError.message,
                    paymentIntentId: paymentIntent._id
            });
        }
        } else {
            // For other payment methods, return payment intent without payment link
        res.status(201).json({
            message: 'Thanh toán đã được khởi tạo thành công',
            paymentIntent: {
                _id: paymentIntent._id,
                orderCode: paymentIntent.orderCode,
                total: paymentIntent.total,
                status: paymentIntent.status
        }
    });
    }

    } catch (error) {
        console.error('Lỗi tạo thanh toán:', error);
        res.status(500).json({ 
            message: 'Lỗi tạo thanh toán', 
            error: error.message 
        });
    }
});

// Get orders for current user
router.get('/', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.userId })
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
    }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findOne({ 
            _id: req.params.id, 
            user: req.user.userId 
        }).populate('items.product', 'name images');

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng', error: error.message });
    }
});

// Get order by order code (public for success page)
router.get('/code/:orderCode', async (req, res) => {
    try {
        // First try to find the completed order
        let order = await Order.findOne({ 
            orderCode: parseInt(req.params.orderCode)
        }).populate('items.product', 'name images');
        
        if (order) {
            return res.json(order);
        }
        
        // If no order found, check payment intent
        const paymentIntent = await PaymentIntent.findOne({ 
            orderCode: parseInt(req.params.orderCode)
        }).populate('items.product', 'name images');
        
        if (!paymentIntent) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        
        // If user reached success page but no order exists, create the order
        // This handles cases where PayOS webhook failed or was delayed
        if (req.query.success === 'true' || req.headers.referer?.includes('order-success')) {
            console.log(`Creating order from success page return for orderCode: ${req.params.orderCode}`);
            
            // Create the order data
            const orderData = {
                user: paymentIntent.user,
                orderCode: paymentIntent.orderCode,
                items: paymentIntent.items,
                total: paymentIntent.total,
                customerInfo: paymentIntent.customerInfo,
                paymentMethod: paymentIntent.paymentMethod,
                paymentLinkId: paymentIntent.paymentLinkId,
                status: 'confirmed',
                paidAt: new Date()
            };

            // Create the order
            order = new Order(orderData);
            await order.save();

            // Update product quantities for in-stock items
            await updateProductQuantities(orderData.items);

            // Update payment intent status
            paymentIntent.status = 'completed';
            await paymentIntent.save();
            
            // Clear user's cart after successful payment
            console.log(`Clearing cart for user: ${paymentIntent.user} (from success page)`);
            const deletedCart = await Cart.findOneAndDelete({ user: paymentIntent.user });
            if (deletedCart) {
                console.log(`Cart cleared successfully for user: ${paymentIntent.user}`);
            } else {
                console.log(`No cart found to clear for user: ${paymentIntent.user}`);
            }
        
            console.log(`Order ${req.params.orderCode} created successfully from success page return`);
            
            // Return the newly created order
            const populatedOrder = await Order.findById(order._id).populate('items.product', 'name images');
            return res.json(populatedOrder);
        }
        
        // Return payment intent data formatted like an order (for pending payments)
        const formattedResponse = {
            orderCode: paymentIntent.orderCode,
            total: paymentIntent.total,
            status: paymentIntent.status === 'completed' ? 'confirmed' : paymentIntent.status,
            customerInfo: paymentIntent.customerInfo,
            items: paymentIntent.items,
            createdAt: paymentIntent.createdAt
        };
        
        res.json(formattedResponse);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng', error: error.message });
    }
});

// Webhook handler for PayOS payment status updates
router.post('/payos-webhook', async (req, res) => {
    try {
        console.log('PayOS webhook received:', req.body);
        
        const { orderCode, status, amount } = req.body;
        
        // Find payment intent by orderCode
        const paymentIntent = await PaymentIntent.findOne({ orderCode: parseInt(orderCode) })
            .populate('items.product');
        
        if (!paymentIntent) {
            console.error('Payment intent not found for orderCode:', orderCode);
            return res.status(404).json({ message: 'Thanh toán không tồn tại' });
        }

        // Update payment intent status based on PayOS status
        switch (status) {
            case 'PAID':
                // Payment successful - create the actual order
                const orderData = {
                    user: paymentIntent.user,
                    orderCode: paymentIntent.orderCode,
                    items: paymentIntent.items,
                    total: paymentIntent.total,
                    customerInfo: paymentIntent.customerInfo,
                    paymentMethod: paymentIntent.paymentMethod,
                    paymentLinkId: paymentIntent.paymentLinkId,
                    status: 'confirmed',
                    paidAt: new Date()
                };

                // Create the order ONLY after payment success
                console.log(`Creating order for orderCode: ${orderCode} after successful payment`);
                const order = new Order(orderData);
                await order.save();

                // Update product quantities for in-stock items
                await updateProductQuantities(orderData.items);

                // Update payment intent status
                paymentIntent.status = 'completed';
                await paymentIntent.save();
                
                // Clear user's cart after successful payment
                console.log(`Clearing cart for user: ${paymentIntent.user}`);
                const deletedCart = await Cart.findOneAndDelete({ user: paymentIntent.user });
                if (deletedCart) {
                    console.log(`Cart cleared successfully for user: ${paymentIntent.user}`);
                } else {
                    console.log(`No cart found to clear for user: ${paymentIntent.user}`);
                }
                
                console.log(`Order ${orderCode} created successfully after payment`);
                break;
                
            case 'CANCELLED':
                paymentIntent.status = 'cancelled';
                await paymentIntent.save();
                console.log(`Payment ${orderCode} cancelled`);
                break;
                
            default:
                paymentIntent.status = status.toLowerCase();
                await paymentIntent.save();
                console.log(`Payment ${orderCode} status: ${status}`);
        }
        
        res.json({ message: 'Webhook processed successfully' });
        
    } catch (error) {
        console.error('Error processing PayOS webhook:', error);
        res.status(500).json({ message: 'Lỗi xử lý webhook' });
    }
});

// Get all orders (admin only)
router.get('/admin/all', [auth, admin], async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
         
        const query = {};
        if (status) query.status = status;

        // Add search functionality
        if (search) {
            console.log('Searching for:', search);
            const searchRegex = new RegExp(search, 'i');
            
            // First, find users that match the search term
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: searchRegex } },
                    { username: { $regex: searchRegex } },
                    { email: { $regex: searchRegex } }
                ]
            }).select('_id');
            
            const matchingUserIds = matchingUsers.map(user => user._id);
            console.log('Matching users found:', matchingUserIds.length);
            
            const searchConditions = [
                { status: { $regex: searchRegex } },
                { 'customerInfo.fullName': { $regex: searchRegex } },
                { 'customerInfo.email': { $regex: searchRegex } },
                { 'customerInfo.phone': { $regex: searchRegex } }
            ];

            // Add user-based search conditions
            if (matchingUserIds.length > 0) {
                searchConditions.push({ user: { $in: matchingUserIds } });
            }

            // Handle orderCode search separately since it's a number
            const orderCodeNum = parseInt(search);
            if (!isNaN(orderCodeNum)) {
                console.log('Searching for exact orderCode:', orderCodeNum);
                // Exact match for full orderCode
                searchConditions.push({ orderCode: orderCodeNum });
            }

            // Also search by partial orderCode if the search term is numeric
            if (/^\d+$/.test(search)) {
                console.log('Searching for partial orderCode:', search);
                // Convert orderCode to string and search for partial matches
                searchConditions.push({
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$orderCode" },
                            regex: search
                        }
                    }
                });
            }

            query.$or = searchConditions;
            console.log('Final search query:', JSON.stringify(query, null, 2));
        }

        const orders = await Order.find(query)
            .populate('items.product')
            .populate('user', 'name email username avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Order.countDocuments(query);

        res.json({
            orders,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalOrders: count
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
    }
});

// Update order status (admin only)
router.put('/:id/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        order.status = status;
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật trạng thái đơn hàng', error: error.message });
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
        res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
    }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email username avatar');

        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Check if user is authorized to view this order
        if (order.user._id.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng', error: error.message });
    }
});



// Debug route to check payment intents and orders
router.get('/debug/status', async (req, res) => {
    try {
        const paymentIntents = await PaymentIntent.find().sort({ createdAt: -1 }).limit(10);
        const orders = await Order.find().sort({ createdAt: -1 }).limit(10);

        res.json({
            summary: {
                paymentIntentsCount: await PaymentIntent.countDocuments(),
                ordersCount: await Order.countDocuments()
            },
            paymentIntents: paymentIntents.map(pi => ({
                orderCode: pi.orderCode,
                status: pi.status,
                total: pi.total,
                createdAt: pi.createdAt
            })),
            orders: orders.map(o => ({
                orderCode: o.orderCode,
                status: o.status,
                total: o.total,
                createdAt: o.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa đơn hàng và thanh toán', error: error.message });
    }
});

// Debug route to clear all orders and payment intents (for testing)
router.delete('/debug/clear', async (req, res) => {
    try {
        const deletedOrders = await Order.deleteMany({});
        const deletedPaymentIntents = await PaymentIntent.deleteMany({});

        res.json({
            message: 'All orders and payment intents cleared',
            deletedOrders: deletedOrders.deletedCount,
            deletedPaymentIntents: deletedPaymentIntents.deletedCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa đơn hàng và thanh toán', error: error.message });
    }
});

module.exports = router; 