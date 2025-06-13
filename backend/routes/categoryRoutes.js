const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middlewares/auth');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({})
            .sort('name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh mục sản phẩm', error: error.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Danh mục sản phẩm không tồn tại' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh mục sản phẩm', error: error.message });
    }
});

// Create a new category (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        console.log('Creating category with data:', req.body);
        
        // Check if category with this name already exists
        const existingCategory = await Category.findOne({ name: req.body.name.trim() });
        if (existingCategory) {
            console.log('Found existing category:', existingCategory.name);
            return res.status(400).json({ message: 'Tên danh mục sản phẩm đã tồn tại' });
        }

        const category = new Category({
            name: req.body.name,
            description: req.body.description
        });

        const savedCategory = await category.save();
        console.log('Category created successfully:', savedCategory.name);
        res.status(201).json(savedCategory);
    } catch (error) {
        console.error('Lỗi tạo danh mục sản phẩm:', error);
        if (error.code === 11000) {
            console.log('Duplicate key error details:', error.keyValue);
            return res.status(400).json({ message: 'Tên danh mục sản phẩm đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi tạo danh mục sản phẩm', error: error.message });
    }
});

// Update a category (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Danh mục sản phẩm không tồn tại' });
        }

        // Update category fields
        category.name = req.body.name || category.name;
        category.description = req.body.description || category.description;
        category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên danh mục sản phẩm đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi cập nhật danh mục sản phẩm', error: error.message });
    }
});

// Delete a category (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Danh mục sản phẩm không tồn tại' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Danh mục sản phẩm đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa danh mục sản phẩm', error: error.message });
    }
});

module.exports = router; 