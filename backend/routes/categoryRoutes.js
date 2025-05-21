const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middlewares/auth');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort('name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
});

// Create a new category (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const category = new Category({
            name: req.body.name,
            description: req.body.description
        });

        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
});

// Update a category (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Update category fields
        category.name = req.body.name || category.name;
        category.description = req.body.description || category.description;
        category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Category name already exists' });
        }
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
});

// Delete a category (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
});

module.exports = router; 