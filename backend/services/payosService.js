const axios = require('axios');
const crypto = require('crypto');

class PayOSService {
    constructor() {
        this.clientId = process.env.PAYOS_CLIENT_ID;
        this.apiKey = process.env.PAYOS_API_KEY;
        this.checksumKey = process.env.PAYOS_CHECKSUM_KEY;
        this.baseUrl = 'https://api-merchant.payos.vn';

        // Validate configuration
        if (!this.clientId || !this.apiKey || !this.checksumKey) {
            console.error('PayOS configuration is missing. Please check your environment variables.');
            throw new Error('PayOS configuration is missing');
        }
    }

    generateSignature(data) {
        // Create a copy of the data to avoid modifying the original
        const signatureData = { ...data };

        // Ensure all numeric values are integers
        signatureData.orderCode = parseInt(signatureData.orderCode);
        signatureData.amount = parseInt(signatureData.amount);

        // Create the data string with only required parameters in exact order
        const dataString = [
            `amount=${signatureData.amount}`,
            `cancelUrl=${signatureData.cancelUrl}`,
            `description=${signatureData.description}`,
            `orderCode=${signatureData.orderCode}`,
            `returnUrl=${signatureData.returnUrl}`
        ].join('&');

        console.log('Data string for signature:', dataString);

        // Generate HMAC SHA256 signature
        const signature = crypto
            .createHmac('sha256', this.checksumKey)
            .update(dataString)
            .digest('hex');

        console.log('Generated signature:', signature);
        return signature;
    }

    async createPaymentLink(orderData) {
        try {
            const { orderCode, amount, description, items, returnUrl, cancelUrl } = orderData;

            // Validate required fields
            if (!orderCode || !amount || !description || !items || !returnUrl || !cancelUrl) {
                throw new Error('Missing required fields for payment link creation');
            }

            // Prepare data with exact types and format
            const data = {
                orderCode: parseInt(orderCode),
                amount: parseInt(amount),
                description: description.trim(),
                items: items.map(item => ({
                    name: item.name.trim(),
                    quantity: parseInt(item.quantity),
                    price: parseInt(item.price)
                })),
                returnUrl: returnUrl.trim(),
                cancelUrl: cancelUrl.trim(),
                expiredAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
            };

            // Generate signature before sending
            const signature = this.generateSignature(data);
            data.signature = signature;

            console.log('Creating payment link with data:', {
                ...data,
                signature: signature // Show the actual signature for debugging
            });

            const response = await axios.post(
                `${this.baseUrl}/v2/payment-requests`,
                data,
                {
                    headers: {
                        'x-client-id': this.clientId,
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('PayOS API Response:', response.data);

            if (!response.data || response.data.code !== '00') {
                throw new Error(response.data?.desc || 'Failed to create payment link');
            }

            if (!response.data.data) {
                throw new Error('Invalid response from PayOS API');
            }

            return {
                paymentLinkId: response.data.data.id,
                checkoutUrl: response.data.data.checkoutUrl,
                qrCode: response.data.data.qrCode
            };
        } catch (error) {
            console.error('Error creating payment link:', {
                message: error.message,
                response: error.response?.data,
                stack: error.stack
            });
            throw error;
        }
    }

    async getPaymentStatus(paymentLinkId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/v2/payment-requests/${paymentLinkId}`,
                {
                    headers: {
                        'x-client-id': this.clientId,
                        'x-api-key': this.apiKey
                    }
                }
            );

            if (response.data.code !== '00') {
                throw new Error(response.data.desc || 'Failed to get payment status');
            }

            return {
                status: response.data.data.status,
                amount: response.data.data.amount,
                amountPaid: response.data.data.amountPaid
            };
        } catch (error) {
            console.error('Error getting payment status:', error.response?.data || error.message);
            throw error;
        }
    }

    async cancelPayment(paymentLinkId, reason) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/v2/payment-requests/${paymentLinkId}/cancel`,
                { cancellationReason: reason },
                {
                    headers: {
                        'x-client-id': this.clientId,
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.code !== '00') {
                throw new Error(response.data.desc || 'Failed to cancel payment');
            }

            return {
                status: response.data.data.status,
                cancelledAt: response.data.data.canceledAt
            };
        } catch (error) {
            console.error('Error canceling payment:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new PayOSService(); 