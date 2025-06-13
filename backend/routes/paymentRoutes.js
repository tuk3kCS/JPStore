const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const paymentService = require('../services/paymentService');
const auth = require('../middleware/auth');

// Create payment link for cart
router.post('/create', auth, async (req, res) => {
    try {
        const { cartId, shippingAddress, paymentMethod, notes } = req.body;

        // Validate cart exists and belongs to user
        const cart = await Cart.findOne({ _id: cartId, user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }

        const paymentResponse = await paymentService.createPaymentLink(
            cartId,
            req.user.userId,
            shippingAddress,
            paymentMethod,
            notes
        );

        res.json({
            paymentUrl: paymentResponse.data.checkoutUrl,
            qrCode: paymentResponse.data.qrCode,
            cartId: cartId
        });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ message: 'Lỗi tạo thanh toán', error: error.message });
    }
});

// Verify payment status
router.get('/verify/:cartId', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ _id: req.params.cartId, user: req.user.userId });
        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });
        }

        const paymentStatus = await paymentService.verifyPayment(cart._id.toString());
        res.json(paymentStatus);
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Lỗi xác thực thanh toán', error: error.message });
    }
});

// Webhook endpoint for PayOS payment notifications
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-signature'];
        if (!signature) {
            return res.status(401).json({ message: 'Thiếu chữ ký' });
        }

        // Verify webhook signature
        if (!paymentService.verifyWebhookSignature(req.body, signature)) {
            return res.status(401).json({ message: 'Chữ ký không hợp lệ' });
        }

        const { orderCode, status } = req.body;

        if (status === 'PAID') {
            // Create order from payment
            const order = await paymentService.createOrderFromPayment({
                cartId: orderCode,
                paymentStatus: 'paid'
            });

            res.json({ 
                message: 'Thanh toán đã được xử lý và đơn hàng đã được tạo thành công',
                orderId: order._id
            });
        } else if (status === 'CANCELLED') {
            res.json({ message: 'Thanh toán đã bị hủy' });
        } else {
            res.json({ message: `Trạng thái thanh toán: ${status}` });
        }
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Lỗi xử lý webhook', error: error.message });
    }
});

module.exports = router; 