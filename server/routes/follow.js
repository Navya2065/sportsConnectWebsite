const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   PUT /api/follow/:id
// @desc    Follow or unfollow a user
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $pull: { followers: req.user._id } });
    } else {
      // Follow
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: req.params.id } });
      await User.findByIdAndUpdate(req.params.id, { $addToSet: { followers: req.user._id } });

      // Create notification
      await Notification.create({
        recipient: req.params.id,
        sender: req.user._id,
        type: 'follow',
        message: `${req.user.name} started following you`,
      });
    }

    res.json({ following: !isFollowing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/follow/:id/followers
// @desc    Get followers of a user
// @access  Private
router.get('/:id/followers', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name avatar role sport company isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ followers: user.followers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/follow/:id/following
// @desc    Get following list of a user
// @access  Private
router.get('/:id/following', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name avatar role sport company isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ following: user.following });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;