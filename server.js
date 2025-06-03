const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// Load env variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const app = express();

// Example Axios request for the friends list

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json()); // for parsing application/json

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/friend', require('./routes/friendRoutes')) // Authentication routes

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
// Route to get user details by emai
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});
