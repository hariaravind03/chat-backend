const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,  // Ensure email is stored in lowercase
    trim: true,       // Remove leading/trailing spaces
  },
  password: {
    type: String, // The password will be hashed before saving
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model itself
  }],
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;


