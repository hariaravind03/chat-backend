const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp } = require('../controllers/authController');

// @route   POST /api/send-otp
// @desc    Send OTP to user's email

router.post('/send-otp', sendOtp);

// @route   POST /api/verify-otp
// @desc    Verify OTP and login user
router.post('/verify-otp', verifyOtp);

module.exports = router;
