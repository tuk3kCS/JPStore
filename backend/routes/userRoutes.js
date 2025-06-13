const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middlewares/auth');
const { uploadUserAvatar } = require('../middlewares/upload');
const path = require('path');
const fs = require('fs');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, name, phone, address } = req.body;

        // Check if user already exists (by email or username)
        let user = await User.findOne({ 
            $or: [
                { email },
                { username }
            ]
        });
        
        if (user) {
            if (user.email === email) {
                return res.status(400).json({ message: 'Email đã tồn tại' });
            }
            if (user.username === username) {
                return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
            }
        }

        // Create new user with plain password (will be hashed by pre-save hook)
        user = new User({
            username,
            email,
            password, // Send plain password, pre-save hook will hash it
            name,
            phone,
            address
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng ký người dùng', error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Người dùng không tồn tại' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không chính xác' });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('Profile update request body:', req.body);
        const { name, email, phone, address } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        console.log('Current user email:', user.email);
        console.log('New email from request:', email);

        // Check if email is being changed and if it already exists
        if (email && email !== user.email) {
            console.log('Email is being changed, checking for duplicates...');
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                console.log('Email already exists for another user');
                return res.status(400).json({ message: 'Email đã tồn tại' });
            }
            console.log('Email is unique, updating...');
            user.email = email;
        }

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;

        console.log('Saving user with updated data...');
        await user.save();
        console.log('User saved successfully');
        
        // Return user without password
        const updatedUser = await User.findById(req.user.userId).select('-password');
        console.log('Returning updated user:', { 
            name: updatedUser.name, 
            email: updatedUser.email, 
            phone: updatedUser.phone, 
            address: updatedUser.address 
        });
        res.json(updatedUser);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật thông tin người dùng', error: error.message });
    }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.userId);

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thay đổi mật khẩu', error: error.message });
    }
});

// Upload avatar image
router.post('/upload-avatar', auth, uploadUserAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên' });
        }

        // Construct the image URL
        const imageUrl = `/images/user/${req.file.filename}`;
        
        // Update user's avatar
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Delete old avatar file if it exists
        if (user.avatar && user.avatar.startsWith('/images/user/')) {
            const oldFilePath = path.join(__dirname, '../public', user.avatar);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        user.avatar = imageUrl;
        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: imageUrl
        });
    } catch (error) {
        // Delete uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../public/images/user', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ message: 'Lỗi tải lên ảnh đại diện', error: error.message });
    }
});

// Remove avatar image
router.delete('/remove-avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Delete avatar file if it exists
        if (user.avatar && user.avatar.startsWith('/images/user/')) {
            const filePath = path.join(__dirname, '../public', user.avatar);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Reset avatar to default
        user.avatar = 'https://via.placeholder.com/150';
        await user.save();

        res.json({
            message: 'Avatar removed successfully',
            avatar: user.avatar
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa ảnh đại diện', error: error.message });
    }
});

// Upload avatar for specific user (admin only)
router.post('/:id/upload-avatar', auth, uploadUserAvatar.single('avatar'), async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên' });
        }

        // Construct the image URL
        const imageUrl = `/images/user/${req.file.filename}`;
        
        // Update user's avatar
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Delete old avatar file if it exists
        if (user.avatar && user.avatar.startsWith('/images/user/')) {
            const oldFilePath = path.join(__dirname, '../public', user.avatar);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        user.avatar = imageUrl;
        await user.save();

        // Return user without password
        const updatedUser = await User.findById(req.params.id).select('-password');
        res.json({
            message: 'Avatar uploaded successfully',
            user: updatedUser
        });
    } catch (error) {
        // Delete uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../public/images/user', req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ message: 'Lỗi tải lên ảnh đại diện', error: error.message });
    }
});

// Get all users (admin only)
router.get('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
    }
});

// Get user by ID (admin only)
router.get('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
    }
});

// Update user by ID (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const { name, email, phone, address, avatar } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Update user fields
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();
        
        // Return user without password
        const updatedUser = await User.findById(req.params.id).select('-password');
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật thông tin người dùng', error: error.message });
    }
});

// Create new user (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const { username, email, password, name, phone, address, avatar } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Tên người dùng, email và mật khẩu là bắt buộc' });
        }

        // Check if user already exists (by email or username)
        let existingUser = await User.findOne({ 
            $or: [
                { email },
                { username }
            ]
        });
        
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email đã tồn tại' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Tên người dùng đã tồn tại' });
            }
        }

        // Create new user with plain password (will be hashed by pre-save hook)
        const user = new User({
            username,
            email,
            password, // Send plain password, pre-save hook will hash it
            name,
            phone,
            address,
            avatar
        });

        await user.save();

        // Return user without password
        const newUser = await User.findById(user._id).select('-password');
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo người dùng', error: error.message });
    }
});

// Promote user to admin (admin only)
router.put('/:id/promote', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Check if user is already an admin
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Người dùng đã là quản trị viên' });
        }

        user.role = 'admin';
        await user.save();

        res.json({ 
            message: 'Người dùng được nâng lên quản trị viên thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi nâng quyền người dùng', error: error.message });
    }
});

// Demote admin to user (admin only)
router.put('/:id/demote', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Check if user is already a regular user
        if (user.role === 'user') {
            return res.status(400).json({ message: 'Người dùng đã là người dùng thường' });
        }

        // Prevent self-demotion
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: 'Quản trị viên không thể hạ quyền lên người dùng thường' });
        }

        user.role = 'user';
        await user.save();

        res.json({ 
            message: 'Quản trị viên đã bị hạ quyền thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hạ quyền người dùng', error: error.message });
    }
});

// Delete user (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Quyền quản trị viên được yêu cầu.' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: 'Quản trị viên không thể xóa tài khoản của chính mình' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Người dùng đã được xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa người dùng', error: error.message });
    }
});

module.exports = router; 