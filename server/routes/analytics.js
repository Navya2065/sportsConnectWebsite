const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const Sponsorship = require('../models/Sponsorship');
const User        = require('../models/User');

// ─── helpers ───────────────────────────────────────────────────────────────
function last6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1,
      label: d.toLocaleString('default', { month: 'short' }) });
  }
  return months;
}

function countByMonth(docs, months) {
  return months.map(m => ({
    label: m.label,
    count: docs.filter(d => {
      const c = new Date(d.createdAt);
      return c.getFullYear() === m.year && c.getMonth() + 1 === m.month;
    }).length
  }));
}

// ─── GET /api/analytics ────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const uid   = req.user._id;
    const role  = req.user.role;  // 'athlete' | 'sponsor'
    const months = last6Months();

    if (role === 'athlete') {
      // all sponsorships where this user is the athlete
      const deals = await Sponsorship.find({ athlete: uid }).populate('sponsor', 'name avatar');

      const byStatus = {
        pending:   deals.filter(d => d.status === 'pending').length,
        active:    deals.filter(d => d.status === 'active').length,
        completed: deals.filter(d => d.status === 'completed').length,
        rejected:  deals.filter(d => d.status === 'rejected').length,
      };

      const completed = deals.filter(d => d.status === 'completed');
      const totalEarnings = completed.reduce((s, d) => s + (d.deal?.value || 0), 0);
      const avgDealValue  = completed.length ? Math.round(totalEarnings / completed.length) : 0;

      const monthly = countByMonth(deals, months);

      // recent deals (last 5)
      const recent = deals.slice(-5).reverse().map(d => ({
        id: d._id,
        sponsor: { name: d.sponsor?.name, avatar: d.sponsor?.avatar },
        title: d.deal?.title,
        value: d.deal?.value,
        currency: d.deal?.currency || 'USD',
        status: d.status,
        date: d.createdAt,
      }));

      // profile completeness
      const u = req.user;
      let profileScore = 0;
      if (u.avatar)               profileScore += 15;
      if (u.bio?.trim())          profileScore += 15;
      if (u.location?.trim())     profileScore += 10;
      if (u.sport?.trim())        profileScore += 10;
      if (u.followers != null)    profileScore += 10;
      if (u.achievements?.length) profileScore += 15;
      if (u.mediaKit?.trim())     profileScore += 10;
      if (u.portfolio?.length)    profileScore += 10;
      if (u.socialLinks && Object.values(u.socialLinks).some(v => v)) profileScore += 5;

      return res.json({
        role: 'athlete',
        byStatus,
        totalEarnings,
        avgDealValue,
        totalDeals: deals.length,
        averageRating: req.user.averageRating || 0,
        reviewCount:   req.user.reviewCount   || 0,
        profileScore: Math.min(profileScore, 100),
        monthly,
        recent,
      });
    }

    // ── SPONSOR ──────────────────────────────────────────────────────────
    const deals = await Sponsorship.find({ sponsor: uid }).populate('athlete', 'name avatar sport');

    const byStatus = {
      pending:   deals.filter(d => d.status === 'pending').length,
      active:    deals.filter(d => d.status === 'active').length,
      completed: deals.filter(d => d.status === 'completed').length,
      rejected:  deals.filter(d => d.status === 'rejected').length,
    };

    const spent = deals
      .filter(d => d.status === 'active' || d.status === 'completed')
      .reduce((s, d) => s + (d.deal?.value || 0), 0);
    const completedDeals = deals.filter(d => d.status === 'completed');
    const avgDeal = completedDeals.length
      ? Math.round(completedDeals.reduce((s,d) => s + (d.deal?.value||0), 0) / completedDeals.length)
      : 0;

    // sports breakdown
    const sportsMap = {};
    deals.forEach(d => {
      const sp = d.athlete?.sport || 'Other';
      sportsMap[sp] = (sportsMap[sp] || 0) + 1;
    });
    const sportsBreakdown = Object.entries(sportsMap)
      .sort((a,b) => b[1]-a[1])
      .map(([sport, count]) => ({ sport, count, pct: Math.round(count / deals.length * 100) }));

    const monthly = countByMonth(deals, months);

    // top athletes (by deal value)
    const topAthletes = deals
      .filter(d => d.deal?.value)
      .sort((a,b) => (b.deal?.value||0) - (a.deal?.value||0))
      .slice(0,5)
      .map(d => ({
        id: d.athlete?._id,
        name: d.athlete?.name,
        avatar: d.athlete?.avatar,
        sport: d.athlete?.sport,
        value: d.deal?.value,
        currency: d.deal?.currency || 'USD',
        status: d.status,
      }));

    return res.json({
      role: 'sponsor',
      byStatus,
      totalSpent: spent,
      avgDealValue: avgDeal,
      totalDeals: deals.length,
      acceptanceRate: deals.length
        ? Math.round((byStatus.active + byStatus.completed) / deals.length * 100)
        : 0,
      sportsBreakdown,
      monthly,
      topAthletes,
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Analytics error', error: err.message });
  }
});

module.exports = router;
