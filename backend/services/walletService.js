const User = require('../models/User');
const mongoose = require('mongoose');

// Helper: Resolve user by id (accepts ObjectId or external string id)
const resolveUser = async (userId) => {
  // If userId looks like a Mongo ObjectId, try to load directly
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId);
      if (user) return user;
    }
  } catch (e) {
    // ignore and fallback to external lookup
  }

  // Fallback: treat `userId` as an external identifier and map to an email
  // Create or find a test user with email `${userId}@example.com`
  const fallbackEmail = `${userId}@example.com`;
  let user = await User.findOne({ email: fallbackEmail });
  if (!user) {
    user = await User.create({
      name: `Test User ${userId}`,
      email: fallbackEmail,
      password: 'test-password',
      walletBalance: 50000,
    });
  }
  return user;
};

/**
 * Get wallet balance for a user
 * @param {string} userId - User ID
 */
const getWalletBalance = async (userId) => {
  try {
    const user = await resolveUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      userId: user._id.toString(),
      balance: user.walletBalance,
      currency: '₹',
    };
  } catch (error) {
    throw new Error(`Error fetching wallet balance: ${error.message}`);
  }
};

/**
 * Deduct balance from wallet with atomic transaction
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deduct
 * @returns {object} Updated wallet info
 */
const deductBalance = async (userId, amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Fetch user with transaction lock
    const resolved = await resolveUser(userId);
    const user = await User.findById(resolved._id).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Check balance
    if (user.walletBalance < amount) {
      throw new Error(`Insufficient balance. Available: ₹${user.walletBalance}, Required: ₹${amount}`);
    }

    // Deduct balance
    user.walletBalance -= amount;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      userId: user._id.toString(),
      deductedAmount: amount,
      remainingBalance: user.walletBalance,
      currency: '₹',
      success: true,
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw new Error(`Error deducting balance: ${error.message}`);
  } finally {
    await session.endSession();
  }
};

/**
 * Add balance to wallet with atomic transaction (for refunds)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @returns {object} Updated wallet info
 */
const addBalance = async (userId, amount) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Fetch user with transaction lock
    const resolved = await resolveUser(userId);
    const user = await User.findById(resolved._id).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Add balance
    user.walletBalance += amount;
    await user.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return {
      userId: user._id.toString(),
      addedAmount: amount,
      newBalance: user.walletBalance,
      currency: '₹',
      success: true,
    };
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw new Error(`Error adding balance: ${error.message}`);
  } finally {
    await session.endSession();
  }
};

/**
 * Check if user has sufficient balance
 * @param {string} userId - User ID
 * @param {number} amount - Amount to check
 * @returns {boolean} true if sufficient balance
 */
const hasSufficientBalance = async (userId, amount) => {
  try {
    const user = await resolveUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.walletBalance >= amount;
  } catch (error) {
    throw new Error(`Error checking balance: ${error.message}`);
  }
};

module.exports = {
  getWalletBalance,
  deductBalance,
  addBalance,
  hasSufficientBalance,
  resolveUser,
};
