require("dotenv").config();

module.exports = {
    PAYOS_CLIENT_ID: process.env.AYOS_CLIENT_ID,
    PAYOS_API_KEY: process.env.PAYOS_API_KEY,
    PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY,
    PAYOS_BASE_URL: process.env.PAYOS_BASE_URL
};
