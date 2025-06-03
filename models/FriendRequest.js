const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);

module.exports = FriendRequest;
