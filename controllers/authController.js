// controllers/authController.js
const nodemailer = require('nodemailer');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const Redis = require("ioredis");

const client = new Redis("rediss://default:AVM7AAIjcDFlMGNmNTdlN2E1YWQ0NDAzYTZkNTAyOGRjMWNhZTEwMnAxMA@moving-akita-21307.upstash.io:6379");


exports.sendOtp = async (req, res) => {
  const { email, password, action } = req.body;

  if (!email || !password || !action) {
    return res.status(400).json({ error: 'Email, password, and action are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (action === 'signup') {
      // If signing up, reject if user exists
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists. Please log in.' });
      }
    } else if (action === 'login') {
      // If logging in, reject if user doesn't exist
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found. Please sign up.' });
      }

     const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        
        return res.status(401).json({ error: 'Invalid password.' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "signup" or "login".' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP and password for later use (signup only)
   try {
      await client.set(`otp:${email}`, otp, 'EX', 300); // Expires in 5 minutes
    } catch (redisError) {
      console.error('Redis error:', redisError);
      return res.status(500).json({ error: 'Failed to store OTP in Redis.' });
    }

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `OTP for ${action === 'signup' ? 'Signup' : 'Login'}`,
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ message: 'OTP sent to your email.' });

  } catch (err) {
    console.error('sendOtp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};


exports.verifyOtp = async (req, res) => {
  const { email, otp, action, password } = req.body;  // Include password if needed

  try {
    // Retrieve OTP from Redis
    const storedOtp = await client.get(`otp:${email}`);

    // If OTP does not exist or has expired
    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP has expired or does not exist. Please request a new OTP.' });
    }

    // Check if the OTP is valid
    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // Handle signup action
    if (action === 'signup') {
      if (user) {
        return res.status(400).json({ error: 'User already exists. Please login instead.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);  // 10 = salt rounds

      // Proceed with signup
      const newUser = new User({
        email,
        verified: true, // User is verified after OTP
        password: hashedPassword, // Add password here
      });

      await newUser.save();

      // After successful signup, delete OTP from Redis
      await client.del(`otp:${email}`);

      return res.status(200).json({ message: 'User Registered Successfully!' });
    }

    // Handle login action
    if (action === 'login') {
      if (!user) {
        return res.status(404).json({ error: 'User not found. Please sign up.' });
      }

      // OTP verification successful, clear OTP and set verified status
      user.verified = true;
      await user.save();

      // After successful login, delete OTP from Redis
      await client.del(`otp:${email}`);

      return res.status(200).json({ message: 'OTP verified, login successful!' });
    }

    // Invalid action
    return res.status(400).json({ error: 'Invalid action. Use "signup" or "login".' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error verifying OTP.' });
  }
};
