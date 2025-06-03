// routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends, getFriendRequests,removeFriend } = require('../controllers/friendController');
const authMiddleware = require('../authMiddleware'); // Middleware to check authentication

// Send friend request
router.post('/send', authMiddleware, sendFriendRequest);

// Accept friend request
router.post('/accept', authMiddleware, acceptFriendRequest);

// Reject friend request
router.post('/reject', authMiddleware, rejectFriendRequest);

// Get friends list
router.get('/friends', authMiddleware, getFriends);

// Get pending friend requests
router.get('/friend-requests', authMiddleware, getFriendRequests);
router.delete('/remove/:friendId', authMiddleware, removeFriend);

module.exports = router;
