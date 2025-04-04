const payosService = require("../services/payosService");

const createPayment = async (req, res) => {
    try {
        const { amount, description, orderId } = req.body;
        const paymentData = await payosService.createPayment(amount, description, orderId);
        res.json(paymentData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const receiveWebhook = (req, res) => {
    try {
        const paymentData = payosService.handleWebhook(req.body);
        // TODO: Update order status on database
        res.status(200).json({ message: "OK" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { createPayment, receiveWebhook };