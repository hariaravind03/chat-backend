const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const sendFriendRequest = async (req, res) => {
  const { receiverEmail } = req.body;
  const senderId = req.user._id;

  if (!receiverEmail) {
    return res.status(400).json({ message: "Receiver email is required" });
  }

  try {
    const receiver = await User.findOne({ email: receiverEmail });

    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found.' });
    }

    if (receiver._id.equals(senderId)) {
      return res.status(401).json({ message: 'Cannot send friend request to yourself.' });
    }

    // Check if already friends
    const senderUser = await User.findById(senderId);
    const isAlreadyFriend = senderUser.friends.includes(receiver._id);

    if (isAlreadyFriend) {
      return res.status(409).json({ message: 'You are already friends.' });
    }

    // Check for existing pending or rejected friend request
    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiver._id,
      status: { $in: ['pending', 'rejected'] }
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return res.status(400).json({ message: 'Friend request is already pending.' });
    }

    // Remove rejected request if exists
    if (existingRequest && existingRequest.status === 'rejected') {
      await FriendRequest.deleteOne({ _id: existingRequest._id });
    }

    // Create and save new request
    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiver._id,
      status: 'pending',
    });

    await newRequest.save();

    return res.status(200).json({ message: 'Friend request sent successfully!' });

  } catch (error) {
    console.error('Error in sendFriendRequest:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};






const acceptFriendRequest = async (req, res) => {
  const userId = req.user._id;
  const { requestId } = req.body;

  try {
    // 1. Find the friend request
    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // 2. Validate if the current user is the receiver
    if (request.receiver.toString() !== userId.toString()) {
      return res.status(400).json({ message: 'You cannot accept this request' });
    }

    // 3. Add both users to each other's friends list
    const sender = await User.findById(request.sender);
    const receiver = await User.findById(request.receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Avoid duplicates
    if (!sender.friends.includes(receiver._id)) {
      sender.friends.push(receiver._id);
    }

    if (!receiver.friends.includes(sender._id)) {
      receiver.friends.push(sender._id);
    }

    await sender.save();
    await receiver.save();

    // 4. Delete the friend request from the database
    await FriendRequest.findByIdAndDelete(requestId);

    // 5. Success response
    res.status(200).json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const mongoose = require('mongoose'); // Ensure mongoose is imported for ObjectId validation

const rejectFriendRequest = async (req, res) => {
  const userId = req.user._id;  // The logged-in user's ID
  const { requestId } = req.body;  // Friend request ID passed in the body
  console.log('Received requestId:', requestId);

  // Validate requestId format (checks if it's a valid ObjectId)
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: 'Invalid friend request ID' });
  }

  try {
    // Find the friend request by ID
    const request = await FriendRequest.findById(requestId);
    console.log('Found request:', request);  // Log the request object

    if (!request) {
      console.log('No matching request found for requestId:', requestId);
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Log the userId and receiver to make sure they match
    console.log('User ID:', userId);
    console.log('Receiver ID:', request.receiver.toString());

    // Ensure the user is the receiver of the friend request
    if (request.receiver.toString() !== userId) {
      console.log('User is not the receiver. Request cannot be rejected.');
      return res.status(400).json({ message: 'You cannot reject this request' });
    }

    // Remove the friend request from the database
    await FriendRequest.findByIdAndDelete(requestId);
    console.log('Friend request deleted successfully.');

    // Respond with a success message
    res.status(200).json({
      message: 'Friend request rejected and removed successfully',
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get list of friends for the current user
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'email');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching friends' });
  }
};

// Get all pending friend requests for the current user
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id; // Get the current user's ID

    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    // Find friend requests where the receiver is the current user and the request is pending
    const pendingRequests = await FriendRequest.find({ receiver: userId, status: 'pending' }).populate('sender', 'email');
    if (pendingRequests.length === 0) {
  return res.status(200).json([]); // Instead of returning a 404, return an empty array with status 200
}

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: 'Error fetching friend requests' });
  }
};


const removeFriend = async (req,res) => {try {
    const userId = req.user._id; // Get user ID from the authenticated token
    const { friendId } = req.params; // Get friend ID from the request parameters
    // Find the user and the friend to be removed
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the friend exists in the user's friend list
    const friendIndex = user.friends.indexOf(friendId);
    if (friendIndex === -1) {
      return res.status(404).json({ message: 'Friend not found in your friend list' });
    }

    // Remove friend from user's friend list
    user.friends.splice(friendIndex, 1); // Remove friendId from the array
    await user.save(); // Save the updated user document

    // Optionally, remove the user from the friend's friend list as well (to maintain mutual friendship)
    const friend = await User.findById(friendId);
    if (friend) {
      const friendIndexInFriendList = friend.friends.indexOf(userId);
      if (friendIndexInFriendList !== -1) {
        friend.friends.splice(friendIndexInFriendList, 1);
        await friend.save();
      }
    }

    // Send success response
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports = { 
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend
};
