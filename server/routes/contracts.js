const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

const Contract    = require('../models/Contract');
const Sponsorship = require('../models/Sponsorship');
const Notification = require('../models/Notification');
const User        = require('../models/User');
const { protect }   = require('../middleware/auth');
const { generateContractHTML } = require('../utils/contractTemplate');

// Middleware that accepts token from Authorization header OR ?token= query param
// Used for the HTML endpoint which is loaded directly in an iframe/new tab
const protectFlexible = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    if (!token) return res.status(401).send('<p>Not authorized</p>');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).send('<p>User not found</p>');
    next();
  } catch {
    res.status(401).send('<p>Token invalid or expired</p>');
  }
};

// Helper: emit real-time event
const emit = (userId, event, data) => {
  if (global.io) global.io.to(`user_${userId}`).emit(event, data);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contracts
// Generate a new contract for an active deal (sponsor only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { sponsorshipId, templateType, customTerms } = req.body;

    if (!sponsorshipId) {
      return res.status(400).json({ message: 'Sponsorship ID is required' });
    }

    // Verify the sponsorship exists and is active
    const sponsorship = await Sponsorship.findById(sponsorshipId)
      .populate('athlete', 'name sport location')
      .populate('sponsor', 'name company industry');

    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }
    if (sponsorship.status !== 'active') {
      return res.status(400).json({ message: 'Contracts can only be generated for active deals' });
    }

    // Only the sponsor of this deal can generate
    if (sponsorship.sponsor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the sponsor can generate the contract' });
    }

    // Check if contract already exists
    const existing = await Contract.findOne({ sponsorship: sponsorshipId });
    if (existing) {
      return res.status(400).json({ message: 'A contract already exists for this deal', contractId: existing._id });
    }

    // Create the contract and auto-sign on behalf of sponsor (they're generating it)
    const contract = await Contract.create({
      sponsorship:    sponsorshipId,
      templateType:   templateType || 'brand_ambassador',
      customTerms:    customTerms  || '',
      status:         'pending_athlete',
      sponsorSignature: {
        name:     req.user.name,
        signedAt: new Date(),
      },
    });

    // Notify athlete
    const notif = await Notification.create({
      recipient: sponsorship.athlete._id,
      sender:    req.user._id,
      type:      'sponsorship',
      message:   `${req.user.company || req.user.name} has sent you a sponsorship contract to review and sign`,
    });
    const populated = await Notification.findById(notif._id).populate('sender', 'name avatar role isVerified');
    emit(sponsorship.athlete._id.toString(), 'notification:new', populated);

    res.status(201).json({ contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contracts/sponsorship/:sponsorshipId
// Get contract for a given deal (both parties)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sponsorship/:sponsorshipId', protect, async (req, res) => {
  try {
    const contract = await Contract.findOne({ sponsorship: req.params.sponsorshipId });
    if (!contract) {
      return res.status(404).json({ message: 'No contract found for this deal' });
    }
    res.json({ contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contracts/:id
// Get contract details (both parties)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate({
        path: 'sponsorship',
        populate: [
          { path: 'athlete', select: 'name sport location avatar' },
          { path: 'sponsor', select: 'name company industry avatar' },
        ],
      });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Only the two parties can view
    const { athlete, sponsor } = contract.sponsorship;
    const uid = req.user._id.toString();
    if (athlete._id.toString() !== uid && sponsor._id.toString() !== uid) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/contracts/:id/sign
// Athlete signs the contract
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/sign', protect, async (req, res) => {
  try {
    const { signatureName } = req.body;
    if (!signatureName?.trim()) {
      return res.status(400).json({ message: 'Signature name is required' });
    }

    const contract = await Contract.findById(req.params.id)
      .populate({
        path: 'sponsorship',
        populate: [
          { path: 'athlete', select: 'name sport location' },
          { path: 'sponsor', select: 'name company industry' },
        ],
      });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const { athlete, sponsor } = contract.sponsorship;
    const uid = req.user._id.toString();

    // Only athlete signs here (sponsor already signs at generation)
    if (athlete._id.toString() !== uid) {
      return res.status(403).json({ message: 'Only the athlete can sign at this stage' });
    }

    if (contract.status !== 'pending_athlete') {
      return res.status(400).json({ message: 'Contract is not awaiting your signature' });
    }

    contract.athleteSignature = { name: signatureName.trim(), signedAt: new Date() };
    contract.status = 'fully_signed';
    await contract.save();

    // Notify sponsor
    const notif = await Notification.create({
      recipient: sponsor._id,
      sender:    req.user._id,
      type:      'sponsorship',
      message:   `${req.user.name} has signed the sponsorship contract "${contract.sponsorship.deal?.title || ''}"`,
    });
    const populated = await Notification.findById(notif._id).populate('sender', 'name avatar role isVerified');
    emit(sponsor._id.toString(), 'notification:new', populated);
    emit(sponsor._id.toString(), 'contract:signed', { contractId: contract._id });

    res.json({ contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contracts/:id/html
// Returns the full printable HTML contract (both parties, any status)
// Uses protectFlexible so it works in iframes and new-tab loads (token via query param)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/html', protectFlexible, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate({
        path: 'sponsorship',
        populate: [
          { path: 'athlete', select: 'name sport location' },
          { path: 'sponsor', select: 'name company industry' },
        ],
      });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Only parties can view
    const { athlete, sponsor } = contract.sponsorship;
    const uid = req.user._id.toString();
    if (athlete._id.toString() !== uid && sponsor._id.toString() !== uid) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const html = generateContractHTML(contract, contract.sponsorship);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/contracts/:id/void
// Void a contract (sponsor only, before fully signed)
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/void', protect, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate({ path: 'sponsorship', populate: { path: 'sponsor', select: '_id' } });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.sponsorship.sponsor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the sponsor can void this contract' });
    }

    if (contract.status === 'fully_signed') {
      return res.status(400).json({ message: 'A fully signed contract cannot be voided unilaterally' });
    }

    contract.status = 'voided';
    await contract.save();

    res.json({ contract });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
