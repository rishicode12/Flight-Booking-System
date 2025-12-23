const { getWalletBalance, deductBalance, hasSufficientBalance } = require('../services/walletService');

/**
 * GET /api/wallet
 * Fetch current wallet balance for a user
 */
const getWallet = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: 'userId query parameter is required',
      });
    }

    const walletInfo = await getWalletBalance(userId);
    res.status(200).json({
      success: true,
      data: walletInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * POST /api/wallet/deduct
 * Deduct amount from wallet balance
 */
const deductWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be provided and greater than 0',
      });
    }

    // Check if user has sufficient balance before deducting
    const hasSufficientFunds = await hasSufficientBalance(userId, amount);
    if (!hasSufficientFunds) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance to deduct ₹${amount}`,
      });
    }

    // Deduct from wallet
    const result = await deductBalance(userId, amount);

    res.status(200).json({
      success: true,
      message: `Successfully deducted ₹${amount} from wallet`,
      description: description || 'Wallet deduction',
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getWallet,
  deductWallet,
};
