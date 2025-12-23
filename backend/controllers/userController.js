const User = require('../models/User');

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        
        const user = await User.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            walletBalance: user.walletBalance
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const topUpWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.params.id);
        if (user) {
            user.walletBalance += Number(amount);
            await user.save();
            res.json({ message: 'Wallet topped up', walletBalance: user.walletBalance });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { registerUser, getUserProfile, topUpWallet };
