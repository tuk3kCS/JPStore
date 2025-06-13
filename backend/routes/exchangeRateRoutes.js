const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const fs = require('fs');
const path = require('path');

// Path to store exchange rate settings
const SETTINGS_FILE_PATH = path.join(__dirname, '../config/exchangeRateSettings.json');

// Ensure config directory exists
const ensureConfigDir = () => {
  const configDir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
};

// Get exchange rate settings (no auth required for reading)
router.get('/settings', async (req, res) => {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const settings = JSON.parse(data);
      res.json({ success: true, settings });
    } else {
      // Return default settings
      res.json({
        success: true,
        settings: {
          type: 'automatic',
          rate: '',
          lastSaved: null
        }
      });
    }
  } catch (error) {
    console.error('Lỗi tải cấu hình tỷ giá:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi tải cấu hình tỷ giá'
    });
  }
});

// Save exchange rate settings (admin only)
router.post('/settings', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
    }

    const { type, rate } = req.body;

    if (!type || !rate) {
      return res.status(400).json({
        success: false,
        error: 'Loại và tỷ giá là bắt buộc'
      });
    }

    const settingsToSave = {
      type,
      rate,
      lastSaved: new Date().toISOString()
    };

    // Ensure config directory exists
    ensureConfigDir();

    // Save to file
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsToSave, null, 2));

    res.json({
      success: true,
      settings: settingsToSave
    });
  } catch (error) {
    console.error('Lỗi lưu cấu hình tỷ giá:', error);
    res.status(500).json({
      success: false,
      error: 'Lỗi lưu cấu hình tỷ giá'
    });
  }
});

module.exports = router; 