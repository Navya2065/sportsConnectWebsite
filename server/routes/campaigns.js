const express  = require('express');
const router   = express.Router();
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware/auth');

// ── helpers ──────────────────────────────────────────────────────────────────
const isSponsor = (req, res, next) =>
  req.user.role === 'sponsor' ? next() : res.status(403).json({ message: 'Sponsors only' });

const isAthlete = (req, res, next) =>
  req.user.role === 'athlete' ? next() : res.status(403).json({ message: 'Athletes only' });

function emitTo(userId, event, payload) {
  if (global.io) global.io.to(userId.toString()).emit(event, payload);
}

// ── GET /api/campaigns  — browse open campaigns (athletes) ────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { sport, minBudget, maxBudget, q } = req.query;
    const filter = { status: 'open' };
    if (sport)      filter.sport = { $regex: sport, $options: 'i' };
    if (q)          filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
    if (minBudget)  filter.budget = { ...filter.budget, $gte: Number(minBudget) };
    if (maxBudget)  filter.budget = { ...filter.budget, $lte: Number(maxBudget) };

    const campaigns = await Campaign.find(filter)
      .populate('sponsor', 'name avatar companyName verified')
      .sort({ createdAt: -1 });

    // attach hasApplied flag for athletes
    const uid = req.user._id.toString();
    const out = campaigns.map(c => {
      const plain = c.toObject({ virtuals: true });
      if (req.user.role === 'athlete') {
        const app = c.applications.find(a => a.athlete.toString() === uid);
        plain.myApplication = app ? { status: app.status, appliedAt: app.appliedAt } : null;
        const inv = c.invites.find(i => i.athlete.toString() === uid);
        plain.myInvite = inv ? { status: inv.status, message: inv.message } : null;
      }
      // hide full applicant details from non-owners
      if (req.user.role !== 'sponsor' || c.sponsor._id?.toString() !== uid) {
        plain.applications = plain.applications?.length ?? 0;
        plain.invites      = plain.invites?.length ?? 0;
      }
      return plain;
    });

    res.json({ campaigns: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/campaigns/mine  — sponsor's own campaigns ───────────────────────
router.get('/mine', protect, isSponsor, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ sponsor: req.user._id })
      .populate('applications.athlete', 'name avatar sport followers averageRating')
      .populate('invites.athlete',      'name avatar sport')
      .sort({ createdAt: -1 });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/campaigns/applied  — athlete's applied campaigns ─────────────────
router.get('/applied', protect, isAthlete, async (req, res) => {
  try {
    const uid = req.user._id;
    const campaigns = await Campaign.find({ 'applications.athlete': uid })
      .populate('sponsor', 'name avatar companyName')
      .sort({ createdAt: -1 });

    const out = campaigns.map(c => {
      const plain = c.toObject({ virtuals: true });
      const app   = c.applications.find(a => a.athlete.toString() === uid.toString());
      plain.myApplication = app;
      plain.applications  = c.applications.length;
      plain.invites       = c.invites.length;
      return plain;
    });
    res.json({ campaigns: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/campaigns/invites  — athlete's invite inbox ─────────────────────
router.get('/invites', protect, isAthlete, async (req, res) => {
  try {
    const uid = req.user._id;
    const campaigns = await Campaign.find({ 'invites.athlete': uid })
      .populate('sponsor', 'name avatar companyName verified')
      .sort({ createdAt: -1 });

    const out = campaigns.map(c => {
      const plain = c.toObject({ virtuals: true });
      const inv   = c.invites.find(i => i.athlete.toString() === uid.toString());
      plain.myInvite     = inv;
      plain.applications = c.applications.length;
      plain.invites      = c.invites.length;
      return plain;
    });
    res.json({ campaigns: out });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/campaigns/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const c = await Campaign.findById(req.params.id)
      .populate('sponsor', 'name avatar companyName verified')
      .populate('applications.athlete', 'name avatar sport followers averageRating reviewCount')
      .populate('invites.athlete',      'name avatar sport');
    if (!c) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/campaigns  — create ─────────────────────────────────────────────
router.post('/', protect, isSponsor, async (req, res) => {
  try {
    const { title, description, sport, budget, currency, slots,
            startDate, endDate, deliverables } = req.body;
    if (!title || !budget) return res.status(400).json({ message: 'Title and budget required' });

    const campaign = await Campaign.create({
      sponsor: req.user._id,
      title, description, sport,
      budget: Number(budget),
      currency: currency || 'INR',
      slots:  Number(slots) || 1,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
      deliverables,
    });
    await campaign.populate('sponsor', 'name avatar companyName');
    res.status(201).json({ campaign });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/campaigns/:id  — update (sponsor/owner) ───────────────────────
router.patch('/:id', protect, isSponsor, async (req, res) => {
  try {
    const c = await Campaign.findOne({ _id: req.params.id, sponsor: req.user._id });
    if (!c) return res.status(404).json({ message: 'Not found' });

    const fields = ['title','description','sport','budget','slots','startDate','endDate','deliverables','status'];
    fields.forEach(f => { if (req.body[f] !== undefined) c[f] = req.body[f]; });
    await c.save();
    res.json({ campaign: c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/campaigns/:id/apply  — athlete applies ─────────────────────────
router.post('/:id/apply', protect, isAthlete, async (req, res) => {
  try {
    const { pitch, askingRate } = req.body;
    const c = await Campaign.findById(req.params.id);
    if (!c)               return res.status(404).json({ message: 'Campaign not found' });
    if (c.status !== 'open') return res.status(400).json({ message: 'Campaign is not open' });
    if (c.slotsLeft === 0)   return res.status(400).json({ message: 'No slots available' });

    const already = c.applications.find(a => a.athlete.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Already applied' });

    c.applications.push({ athlete: req.user._id, pitch, askingRate: Number(askingRate) || 0 });
    await c.save();

    // notify sponsor
    emitTo(c.sponsor, 'campaign:application', {
      campaignId: c._id, campaignTitle: c.title,
      athleteName: req.user.name, athleteId: req.user._id,
    });

    res.json({ message: 'Applied successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/campaigns/:id/application/:athleteId  — sponsor accepts/rejects
router.patch('/:id/application/:athleteId', protect, isSponsor, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected'
    if (!['accepted','rejected'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const c = await Campaign.findOne({ _id: req.params.id, sponsor: req.user._id });
    if (!c) return res.status(404).json({ message: 'Not found' });

    const app = c.applications.find(a => a.athlete.toString() === req.params.athleteId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    app.status = status;
    if (status === 'accepted') {
      c.filledSlots = c.applications.filter(a => a.status === 'accepted').length + 1;
      if (c.filledSlots >= c.slots) c.status = 'closed';
    }
    await c.save();

    emitTo(req.params.athleteId, 'campaign:decision', {
      campaignId: c._id, campaignTitle: c.title, status,
    });

    res.json({ message: `Application ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/campaigns/:id/invite/:athleteId  — sponsor invites ──────────────
router.post('/:id/invite/:athleteId', protect, isSponsor, async (req, res) => {
  try {
    const { message } = req.body;
    const c = await Campaign.findOne({ _id: req.params.id, sponsor: req.user._id });
    if (!c) return res.status(404).json({ message: 'Not found' });

    const already = c.invites.find(i => i.athlete.toString() === req.params.athleteId);
    if (already) return res.status(400).json({ message: 'Already invited' });

    c.invites.push({ athlete: req.params.athleteId, message });
    await c.save();

    emitTo(req.params.athleteId, 'campaign:invite', {
      campaignId: c._id, campaignTitle: c.title,
      sponsorName: req.user.name, message,
    });

    res.json({ message: 'Invite sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/campaigns/:id/invite/respond  — athlete accepts/rejects invite
router.patch('/:id/invite/respond', protect, isAthlete, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected'
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });

    const inv = c.invites.find(i => i.athlete.toString() === req.user._id.toString());
    if (!inv) return res.status(404).json({ message: 'Invite not found' });

    inv.status = status;
    if (status === 'accepted') {
      c.filledSlots = Math.min(c.slots, c.filledSlots + 1);
      if (c.filledSlots >= c.slots) c.status = 'closed';
    }
    await c.save();

    emitTo(c.sponsor, 'campaign:invite_response', {
      campaignId: c._id, campaignTitle: c.title,
      athleteName: req.user.name, status,
    });

    res.json({ message: `Invite ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
