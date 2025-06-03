const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp,getUserByEmail } = require('../controllers/authController');
const { getDashboardData } = require('../controllers/dashboardController');
const authenticate = require('../authMiddleware');
// @route   POST /api/send-otp
// @desc    Send OTP to user's email

router.post('/send-otp', sendOtp);

// Protect the route with authentication middleware
// @route   POST /api/verify-otp
// @desc    Verify OTP and login user
router.post('/verify-otp', verifyOtp);
// Get user by email
router.get('/users', getUserByEmail);

router.get('/dashboard', authenticate, getDashboardData); // ✅ Correct

module.exports = router;
