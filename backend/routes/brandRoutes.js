const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const auth = require('../middlewares/auth');

// Get all brands
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find({ isActive: true })
            .sort('name');
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhà phát hành', error: error.message });
    }
});

// Get single brand
router.get('/:id', async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Nhà phát hành không tồn tại' });
        }
        res.json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin nhà phát hành', error: error.message });
    }
});

// Create a new brand (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const brand = new Brand({
            name: req.body.name,
            description: req.body.description
        });

        const savedBrand = await brand.save();
        res.status(201).json(savedBrand);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên nhà phát hành đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi tạo nhà phát hành', error: error.message });
    }
});

// Update a brand (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Nhà phát hành không tồn tại' });
        }

        // Update brand fields
        brand.name = req.body.name || brand.name;
        brand.description = req.body.description || brand.description;
        brand.isActive = req.body.isActive !== undefined ? req.body.isActive : brand.isActive;

        const updatedBrand = await brand.save();
        res.json(updatedBrand);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên nhà phát hành đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi cập nhật nhà phát hành', error: error.message });
    }
});

// Delete a brand (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Nhà phát hành không tồn tại' });
        }

        await Brand.findByIdAndDelete(req.params.id);
        res.json({ message: 'Nhà phát hành đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa nhà phát hành', error: error.message });
    }
});

module.exports = router; 