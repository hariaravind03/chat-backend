// controllers/dashboardController.js
const User = require('../models/User');

const getDashboardData = async (req, res) => {
  try {
    const email = req.user?.email; // `email` from JWT after middleware

    if (!email) {
      return res.status(400).json({ message: 'Invalid user information' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Customize the dashboard data you want to return
    res.status(200).json({
      message: `Welcome to your dashboard, ${user.email}!`,
      email: user.email,
      joinedAt: user.createdAt, // assuming createdAt field
      // add more user fields if needed
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getDashboardData };
