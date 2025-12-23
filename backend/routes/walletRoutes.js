const express = require('express');
const router = express.Router();
const { getWallet, deductWallet } = require('../controllers/walletController');

// GET /api/wallet - Fetch wallet balance
router.get('/', getWallet);

// POST /api/wallet/deduct - Deduct from wallet with atomic transaction
router.post('/deduct', deductWallet);

module.exports = router;
