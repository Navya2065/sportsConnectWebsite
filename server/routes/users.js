const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Sponsorship = require('../models/Sponsorship');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { calculateMatchScore } = require('../utils/matchScore');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users
// Explore / discovery — supports advanced filters
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const {
      role, sport, industry, search,
      city,
      minFollowers, maxFollowers,
      achievement,
      minEngagement,
      budgetMax,
      page = 1, limit = 12,
    } = req.query;

    // Build conditions array for $and
    const conditions = [
      { _id: { $ne: req.user._id }, isActive: true },
    ];

    if (role)       conditions.push({ role });
    if (sport)      conditions.push({ sport: { $regex: sport, $options: 'i' } });
    if (industry)   conditions.push({ industry: { $regex: industry, $options: 'i' } });
    if (city)       conditions.push({ location: { $regex: city, $options: 'i' } });

    // Followers range — uses $expr to compare array length
    if (minFollowers) {
      conditions.push({
        $expr: { $gte: [{ $size: '$followers' }, parseInt(minFollowers)] },
      });
    }
    if (maxFollowers) {
      conditions.push({
        $expr: { $lte: [{ $size: '$followers' }, parseInt(maxFollowers)] },
      });
    }

    // Achievement keyword in achievements array
    if (achievement) {
      conditions.push({
        achievements: { $elemMatch: { $regex: achievement, $options: 'i' } },
      });
    }

    // Minimum engagement rate
    if (minEngagement) {
      conditions.push({
        'stats.engagementRate': { $gte: parseFloat(minEngagement) },
      });
    }

    // Budget match — show athletes whose askingPriceMin <= sponsor's budget
    if (budgetMax) {
      conditions.push({
        $or: [
          { askingPriceMin: 0 },
          { askingPriceMin: { $exists: false } },
          { askingPriceMin: { $lte: parseFloat(budgetMax) } },
        ],
      });
    }

    // Text search across multiple fields
    if (search) {
      conditions.push({
        $or: [
          { name:     { $regex: search, $options: 'i' } },
          { sport:    { $regex: search, $options: 'i' } },
          { company:  { $regex: search, $options: 'i' } },
          { bio:      { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const query = conditions.length > 1 ? { $and: conditions } : conditions[0];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Attach AI match score when a sponsor is browsing athletes
    const enriched = users.map((u) => {
      const plain = u.toObject();
      if (req.user.role === 'sponsor' && u.role === 'athlete') {
        plain.matchScore = calculateMatchScore(req.user, plain);
      }
      return plain;
    });

    res.json({
      users: enriched,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id/profile
// Full public profile — includes platform-verified past sponsorships
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/profile', protect, async (req, res) => {
  try {
    const profileUser = await User.findById(req.params.id).select('-password');
    if (!profileUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Completed deals = platform-verified previous sponsors
    const completedDeals = profileUser.role === 'athlete'
      ? await Sponsorship.find({ athlete: req.params.id, status: 'completed' })
          .populate('sponsor', 'name avatar company industry website')
          .sort({ updatedAt: -1 })
      : [];

    // Attach AI match score when a sponsor views an athlete's profile
    let matchScore = null;
    if (req.user.role === 'sponsor' && profileUser.role === 'athlete') {
      matchScore = calculateMatchScore(req.user.toObject(), profileUser.toObject());
    }

    res.json({ user: profileUser, completedDeals, matchScore });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// Basic user profile by ID
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/profile/update
// Update own profile (including new media kit / stats / portfolio fields)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/profile/update', protect, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'bio', 'location', 'sport', 'achievements',
      'socialLinks', 'company', 'industry', 'website',
      'sponsorshipBudget', 'interestedSports',
      // New fields
      'stats', 'mediaKit', 'previousSponsors',
      'askingPriceMin', 'askingPriceMax', 'priceCurrency',
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/avatar/upload
// Upload avatar image
// ─────────────────────────────────────────────────────────────────────────────
router.post('/avatar/upload', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`;
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/portfolio/upload
// Upload one or more portfolio images
// ─────────────────────────────────────────────────────────────────────────────
router.post('/portfolio/upload', protect, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const newMedia = req.files.map((file) => {
      const url = file.path || file.secure_url || `/uploads/${file.filename}`;
      const mediaType = file.mimetype?.startsWith('video/') ? 'video' : 'photo';
      const caption = req.body.caption || '';
      return { url, mediaType, caption };
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { portfolioMedia: { $each: newMedia } } },
      { new: true }
    ).select('-password');

    res.json({ user, uploaded: newMedia });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/portfolio/:mediaId
// Remove a portfolio item
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/portfolio/:mediaId', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { portfolioMedia: { _id: req.params.mediaId } } },
      { new: true }
    ).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
