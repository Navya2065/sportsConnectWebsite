const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/users
// @desc    Get all users (explore page) with optional filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { role, sport, industry, search, page = 1, limit = 12 } = req.query;

    const query = { _id: { $ne: req.user._id }, isActive: true };

    if (role) query.role = role;
    if (sport) query.sport = { $regex: sport, $options: 'i' };
    if (industry) query.industry = { $regex: industry, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sport: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update own profile
// @access  Private
router.put('/profile/update', protect, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'location', 'sport', 'achievements',
      'socialLinks', 'company', 'industry', 'website',
      'sponsorshipBudget', 'interestedSports',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload avatar
// @access  Private
router.post('/avatar/upload', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ user, avatarUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;