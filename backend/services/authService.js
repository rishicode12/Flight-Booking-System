const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key-change-this',
    { expiresIn: '7d' }
  );
};

const register = async (name, email, password) => {
  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    throw new Error('User already exists with this email');
  }

  // Create new user
  user = new User({
    name,
    email,
    password
  });

  await user.save();

  const token = generateToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      walletBalance: user.walletBalance
    }
  };
};

const login = async (email, password) => {
  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      walletBalance: user.walletBalance
    }
  };
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-this'
    );
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    walletBalance: user.walletBalance
  };
};

module.exports = {
  register,
  login,
  verifyToken,
  generateToken,
  getUserById
};
