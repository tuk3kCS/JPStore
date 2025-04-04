const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
    const {amount, orderInfo} = req.body;

    try {
        const vietQRResponse = await axios.post('https://api.vietqr.io/generate', {
            bank: "VCB",
            accountNo: "1039903924",
            accountName: "Nguyễn Hoàng Tùng",
            amount,
            memo: orderInfo
        });

        res.json({message: "Tạo QR thành công", qrCode: vietQRResponse.data.data.qrCode});
    }
    catch (error) {
        res.status(500).json({message: "Failed to create QR code", error: error.message});
    }
});

module.exports = router;
