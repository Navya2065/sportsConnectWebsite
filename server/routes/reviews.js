const express    = require('express');
const router     = express.Router();
const Review     = require('../models/Review');
const User       = require('../models/User');
const Sponsorship = require('../models/Sponsorship');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Helper: recalculate and persist averageRating + reviewCount for a user
const refreshRating = async (userId) => {
  const reviews = await Review.find({ reviewee: userId });
  const count   = reviews.length;
  const avg     = count
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  await User.findByIdAndUpdate(userId, { averageRating: avg, reviewCount: count });
};

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Submit a review after a completed deal
router.post('/', protect, async (req, res) => {
  try {
    const { sponsorshipId, rating, review, highlights } = req.body;

    if (!sponsorshipId) return res.status(400).json({ message: 'Sponsorship ID required' });
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    // Deal must exist and be completed
    const sponsorship = await Sponsorship.findById(sponsorshipId)
      .populate('athlete', 'name')
      .populate('sponsor', 'name company');

    if (!sponsorship) return res.status(404).json({ message: 'Sponsorship not found' });
    if (sponsorship.status !== 'completed')
      return res.status(400).json({ message: 'Reviews can only be left for completed deals' });

    // Current user must be one of the parties
    const uid        = req.user._id.toString();
    const athleteId  = sponsorship.athlete._id.toString();
    const sponsorId  = sponsorship.sponsor._id.toString();

    if (uid !== athleteId && uid !== sponsorId)
      return res.status(403).json({ message: 'You are not part of this deal' });

    // Reviewee = the other party
    const revieweeId = uid === sponsorId ? athleteId : sponsorId;

    // Check for duplicate
    const existing = await Review.findOne({ reviewer: uid, sponsorship: sponsorshipId });
    if (existing) return res.status(400).json({ message: 'You have already reviewed this deal' });

    const newReview = await Review.create({
      reviewer:     uid,
      reviewee:     revieweeId,
      sponsorship:  sponsorshipId,
      rating,
      review:       review?.trim() || '',
      highlights:   highlights || [],
      reviewerRole: req.user.role,
    });

    // Recalculate reviewee's aggregate rating
    await refreshRating(revieweeId);

    // Populate for response + notification
    const populated = await Review.findById(newReview._id)
      .populate('reviewer', 'name avatar role company isVerified');

    // Notify reviewee
    const stars    = '⭐'.repeat(rating);
    const fromName = req.user.company || req.user.name;
    const notif = await Notification.create({
      recipient: revieweeId,
      sender:    uid,
      type:      'sponsorship',
      message:   `${fromName} left you a ${stars} review for "${sponsorship.deal?.title || 'your deal'}"`,
    });
    const populatedNotif = await Notification.findById(notif._id)
      .populate('sender', 'name avatar role isVerified');
    if (global.io) {
      global.io.to(`user_${revieweeId}`).emit('notification:new', populatedNotif);
    }

    res.status(201).json({ review: populated });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'You have already reviewed this deal' });
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/reviews/user/:userId ───────────────────────────────────────────
// Get all reviews for a user (public)
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar role company sport isVerified')
      .populate('sponsorship', 'deal')
      .sort({ createdAt: -1 });

    // Also return aggregate stats
    const count = reviews.length;
    const avg   = count
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    // Distribution: how many 5★, 4★, etc.
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({ reviews, count, averageRating: avg, distribution });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/reviews/check/:sponsorshipId ────────────────────────────────────
// Check if current user has already reviewed a specific deal
router.get('/check/:sponsorshipId', protect, async (req, res) => {
  try {
    const existing = await Review.findOne({
      reviewer:    req.user._id,
      sponsorship: req.params.sponsorshipId,
    }).populate('reviewer', 'name avatar');

    res.json({ hasReviewed: !!existing, review: existing || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
