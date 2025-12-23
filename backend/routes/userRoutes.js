const express = require('express');
const router = express.Router();
const { registerUser, getUserProfile, topUpWallet } = require('../controllers/userController');

router.post('/', registerUser);
router.get('/:id', getUserProfile);
router.post('/:id/topup', topUpWallet);

module.exports = router;
