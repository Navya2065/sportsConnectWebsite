const express = require('express');
const router = express.Router();
const Sponsorship = require('../models/Sponsorship');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

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
// @desc    Create a sponsorship request (sponsor only)
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
      return res.status(400).json({ message: 'Sponsorship already exists with this athlete' });
    }

    const sponsorship = await Sponsorship.create({
      athlete: athleteId,
      sponsor: req.user._id,
      deal,
      notes,
      initiatedBy: req.user._id,
    });

    const populated = await Sponsorship.findById(sponsorship._id)
      .populate('athlete', 'name avatar sport')
      .populate('sponsor', 'name avatar company');

    res.status(201).json({ sponsorship: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/sponsorships/:id/status
// @desc    Update sponsorship status (accept/reject by athlete)
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

    sponsorship.status = status;
    await sponsorship.save();

    res.json({ sponsorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;