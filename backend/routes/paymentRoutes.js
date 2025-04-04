const express = require("express");
const { createPayment, receiveWebhook } = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-payment", createPayment);
router.post("/webhook", receiveWebhook);

module.exports = router;