const express = require('express');
const router = express.Router();
const Sponsorship = require('../models/Sponsorship');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Helper: emit real-time notification via socket
const emitNotification = (userId, notification) => {
  if (global.io) {
    global.io.to(`user_${userId}`).emit('notification:new', notification);
  }
};

// @route   GET /api/sponsorships
// @desc    Get all sponsorships for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query =
      req.user.role === 'athlete'
        ? { athlete: req.user._id }
        : { sponsor: req.user._id };

    const sponsorships = await Sponsorship.find(query)
      .populate('athlete', 'name avatar sport location')
      .populate('sponsor', 'name avatar company industry')
      .sort({ createdAt: -1 });

    res.json({ sponsorships });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/sponsorships
// @desc    Create a sponsorship offer (sponsor only)
// @access  Private (sponsor)
router.post('/', protect, authorize('sponsor'), async (req, res) => {
  try {
    const { athleteId, deal, notes } = req.body;

    if (!athleteId) {
      return res.status(400).json({ message: 'Athlete ID is required' });
    }

    // Check if sponsorship already exists
    const existing = await Sponsorship.findOne({
      athlete: athleteId,
      sponsor: req.user._id,
      status: { $in: ['pending', 'active'] },
    });

    if (existing) {
      return res.status(400).json({ message: 'A pending or active sponsorship already exists with this athlete' });
    }

    const sponsorship = await Sponsorship.create({
      athlete: athleteId,
      sponsor: req.user._id,
      deal,
      notes,
      initiatedBy: req.user._id,
    });

    const populated = await Sponsorship.findById(sponsorship._id)
      .populate('athlete', 'name avatar sport location')
      .populate('sponsor', 'name avatar company industry');

    // Create notification for athlete
    const notification = await Notification.create({
      recipient: athleteId,
      sender: req.user._id,
      type: 'sponsorship',
      message: `${req.user.name} sent you a sponsorship offer${deal?.title ? `: "${deal.title}"` : ''}`,
    });

    const populatedNotif = await Notification.findById(notification._id)
      .populate('sender', 'name avatar role isVerified');

    // Real-time emit to athlete
    emitNotification(athleteId.toString(), populatedNotif);

    res.status(201).json({ sponsorship: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/sponsorships/:id/status
// @desc    Accept or reject a sponsorship (athlete only)
// @access  Private (athlete)
router.put('/:id/status', protect, authorize('athlete'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or rejected' });
    }

    const sponsorship = await Sponsorship.findOne({
      _id: req.params.id,
      athlete: req.user._id,
    });

    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }

    if (sponsorship.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending sponsorships can be updated' });
    }

    sponsorship.status = status;
    await sponsorship.save();

    const populated = await Sponsorship.findById(sponsorship._id)
      .populate('athlete', 'name avatar sport location')
      .populate('sponsor', 'name avatar company industry');

    // Notify the sponsor
    const actionText = status === 'active' ? 'accepted' : 'declined';
    const notification = await Notification.create({
      recipient: sponsorship.sponsor,
      sender: req.user._id,
      type: 'sponsorship',
      message: `${req.user.name} ${actionText} your sponsorship offer${populated.deal?.title ? ` "${populated.deal.title}"` : ''}`,
    });

    const populatedNotif = await Notification.findById(notification._id)
      .populate('sender', 'name avatar role isVerified');

    // Real-time emit to sponsor
    emitNotification(sponsorship.sponsor.toString(), populatedNotif);

    // Also emit sponsorship status update to sponsor in real-time
    if (global.io) {
      global.io.to(`user_${sponsorship.sponsor.toString()}`).emit('sponsorship:updated', populated);
    }

    res.json({ sponsorship: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/sponsorships/:id/complete
// @desc    Mark an active deal as completed (sponsor only)
// @access  Private (sponsor)
router.put('/:id/complete', protect, authorize('sponsor'), async (req, res) => {
  try {
    const sponsorship = await Sponsorship.findOne({
      _id: req.params.id,
      sponsor: req.user._id,
    });

    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }

    if (sponsorship.status !== 'active') {
      return res.status(400).json({ message: 'Only active sponsorships can be marked as completed' });
    }

    sponsorship.status = 'completed';
    await sponsorship.save();

    const populated = await Sponsorship.findById(sponsorship._id)
      .populate('athlete', 'name avatar sport location')
      .populate('sponsor', 'name avatar company industry');

    // Notify the athlete
    const notification = await Notification.create({
      recipient: sponsorship.athlete,
      sender: req.user._id,
      type: 'sponsorship',
      message: `${req.user.name} marked your sponsorship${populated.deal?.title ? ` "${populated.deal.title}"` : ''} as completed`,
    });

    const populatedNotif = await Notification.findById(notification._id)
      .populate('sender', 'name avatar role isVerified');

    emitNotification(sponsorship.athlete.toString(), populatedNotif);

    // Real-time emit to athlete
    if (global.io) {
      global.io.to(`user_${sponsorship.athlete.toString()}`).emit('sponsorship:updated', populated);
    }

    res.json({ sponsorship: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
