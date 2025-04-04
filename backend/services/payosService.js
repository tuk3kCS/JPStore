const axios = require("axios");
const crypto = require("crypto");
const config = require("../config/env");

const generateSignature = (data) => {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map(key => `${key}=${data[key]}`).join("&");
    return crypto.createHmac("sha256", config.PAYOS_CHECKSUM_KEY).update(signString).digest("hex");
};

// Create payment invoice
const createPayment = async (amount, description, orderId) => {
    try {

        const requestData = {
            amount,
            orderId: orderId || `order_${Date.now()}`,
            description: description || "Order payment",
            returnUrl: "https://yourwebsite.com/payment-success",
            cancelUrl: "https://yourwebsite.com/payment-failed",
        };

        requestData.signature = generateSignature(requestData);

        const response = await axios.post(`${config.PAYOS_BASE_URL}/payment-requests`, requestData, {
            headers: {
                "x-api-key": config.PAYOS_API_KEY,
                "x-client-id": config.PAYOS_CLIENT_ID
            }
        });

        return response.data;
    }
    catch (error) {
        console.error("Failed to create payment invoice:", error.response?.data || error.message);
        throw new Error("Failed to create order");
    }
};

// Handle webhook from PayOS
const handleWebhook = (receivedData) => {
    const receivedSignature = receivedData.signature;
    delete receivedData.signature;

    const calculatedSignature = generateSignature(receivedData);
    if (receivedSignature !== calculatedSignature) {
        throw new Error("Invalid signature");
    }

    console.log("Receive webhook from PayOS:", receivedData);
    return receivedData;
};

module.exports = { createPayment, handleWebhook };
