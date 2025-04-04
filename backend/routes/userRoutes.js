const express = require('express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const userExists = await User.findOne({email});
        if (userExists) return res.status(400).json({message: "Email existed"});

        const newUser = new User({name, email, password});
        await newUser.save();

        res.json({message: "Registered sucessfully", user: newUser});
    }
    catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
});

// Login
router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({message: "Email and password are required"});
        }

        const user = await User.findOne({email});

        if (!user) {
            return res.status(401).json({message: "Email or password are incorrect"});
        }

        if (!user.password) {
            return res.status(500).json({message: "System error: Password not found in the database"});
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({message: "Email or password are incorrect"});
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d"});

        res.json({token, user});
    }
    catch (error) {
        console.error("Server error: ", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get users' list
router.get('/', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({message: "User not existed"});

        res.json({ message: "Delete user successfully" });
    }
    catch (error) {
        res.status(500).json({message: "Server error", error: error.message});
    }
});

module.exports = router;
