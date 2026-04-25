/**
 * AI Smart Match Score
 * Calculates sponsor ↔ athlete compatibility on a 0–100 scale.
 *
 * Weights:
 *  - Sport / Interest Match  : 30 pts
 *  - Budget Fit              : 25 pts
 *  - Engagement Quality      : 20 pts
 *  - Profile Completeness    : 15 pts
 *  - Rating / Reputation     : 10 pts
 */

const LABELS = [
  { min: 85, label: 'Perfect Match', emoji: '🎯', color: 'green'  },
  { min: 70, label: 'Great Match',   emoji: '⚡', color: 'blue'   },
  { min: 55, label: 'Good Match',    emoji: '👍', color: 'yellow' },
  { min: 40, label: 'Potential',     emoji: '🔍', color: 'muted'  },
  { min: 0,  label: 'Low Match',     emoji: '—',  color: 'muted'  },
];

/** Normalise a value 0–1 safely */
const norm = (val, max) => Math.min(1, Math.max(0, val / max));

/** Fuzzy keyword overlap: how many of arrayA words appear in stringB */
const sportOverlap = (interestedSports = [], athleteSport = '') => {
  if (!athleteSport) return 0;
  const sport = athleteSport.toLowerCase();
  for (const s of interestedSports) {
    const words = s.toLowerCase().split(/\s+/);
    if (words.some((w) => sport.includes(w) || w.includes(sport.split(/\s+/)[0]))) {
      return 1;          // full match
    }
  }
  // Check if any interested sport is a substring of athlete sport
  const interestStr = interestedSports.join(' ').toLowerCase();
  const sportWord = sport.split(/\s+/)[0];
  if (interestStr.includes(sportWord) || sportWord.length > 3) return 0;
  return 0;
};

/**
 * @param {Object} sponsor  - full sponsor User document (lean or mongoose)
 * @param {Object} athlete  - full athlete User document
 * @returns {{ score: number, label: string, emoji: string, color: string, breakdown: Object }}
 */
const calculateMatchScore = (sponsor, athlete) => {
  /* ── 1. Sport / Interest Match (0–30) ──────────────────────────────── */
  let sportPts = 0;
  const interested = sponsor.interestedSports || [];
  const sport      = athlete.sport || '';

  if (interested.length === 0) {
    sportPts = 15; // sponsor hasn't set interests → neutral
  } else {
    const overlap = sportOverlap(interested, sport);
    sportPts = Math.round(overlap * 30);

    // Partial credit: even if no exact match, check individual words
    if (sportPts === 0 && sport) {
      const sportWords    = sport.toLowerCase().split(/\s+/);
      const interestWords = interested.join(' ').toLowerCase().split(/\s+/);
      const sharedWords   = sportWords.filter((w) => interestWords.includes(w) && w.length > 3);
      if (sharedWords.length > 0) sportPts = 10;
    }
  }

  /* ── 2. Budget Fit (0–25) ──────────────────────────────────────────── */
  let budgetPts = 12; // neutral default when no info
  const priceMin = athlete.askingPriceMin || 0;
  const priceMax = athlete.askingPriceMax || 0;

  // Parse sponsor budget string like "₹50k-2L" or "50000-200000" etc.
  // We store sponsorshipBudget as a string; try to extract a number
  const budgetStr = (sponsor.sponsorshipBudget || '').replace(/[^\d.-]/g, '');
  const budgetNum = parseFloat(budgetStr) || 0;

  if (budgetNum > 0 && (priceMin > 0 || priceMax > 0)) {
    const maxPrice = priceMax || priceMin * 2;
    if (priceMin === 0 && priceMax === 0) {
      budgetPts = 12; // athlete hasn't set a price
    } else if (budgetNum >= priceMin && (priceMax === 0 || budgetNum <= priceMax * 1.5)) {
      budgetPts = 25; // perfect fit
    } else if (budgetNum >= priceMin * 0.7) {
      budgetPts = 18; // close fit
    } else if (budgetNum < priceMin * 0.5) {
      budgetPts = 5;  // too low
    } else {
      budgetPts = 10;
    }
  }

  /* ── 3. Engagement Quality (0–20) ──────────────────────────────────── */
  let engagementPts = 0;
  const engRate  = athlete.stats?.engagementRate || 0;
  const views    = athlete.stats?.monthlyViews   || 0;
  const followers = (athlete.followers?.length)  || 0;

  // Engagement rate score: 0% → 0, 5% → 12, 10%+ → 20
  engagementPts += Math.round(norm(engRate, 10) * 12);

  // Follower bonus: 0→0, 10K→4, 100K→6, 1M→8
  const followerScore = followers >= 1_000_000 ? 8
    : followers >= 100_000 ? 6
    : followers >= 10_000  ? 4
    : followers >= 1_000   ? 2
    : 0;
  engagementPts += followerScore;

  engagementPts = Math.min(20, engagementPts);

  /* ── 4. Profile Completeness (0–15) ─────────────────────────────────── */
  let profilePts = 0;
  if (athlete.avatar)                        profilePts += 2;
  if (athlete.bio?.trim())                   profilePts += 2;
  if (athlete.location?.trim())              profilePts += 1;
  if (athlete.achievements?.length > 0)      profilePts += Math.min(3, athlete.achievements.length);
  if (athlete.mediaKit?.headline?.trim())    profilePts += 2;
  if (athlete.portfolioMedia?.length > 0)    profilePts += 2;
  if (athlete.socialLinks?.instagram || athlete.socialLinks?.twitter) profilePts += 1;
  if (athlete.previousSponsors?.length > 0)  profilePts += 2;
  profilePts = Math.min(15, profilePts);

  /* ── 5. Rating / Reputation (0–10) ──────────────────────────────────── */
  let ratingPts = 5; // neutral default
  if (athlete.reviewCount > 0) {
    ratingPts = Math.round(norm(athlete.averageRating, 5) * 10);
  }

  /* ── Total ───────────────────────────────────────────────────────────── */
  const rawScore = sportPts + budgetPts + engagementPts + profilePts + ratingPts;
  const score    = Math.min(100, Math.max(0, rawScore));

  const meta = LABELS.find((l) => score >= l.min) || LABELS[LABELS.length - 1];

  return {
    score,
    label:   meta.label,
    emoji:   meta.emoji,
    color:   meta.color,
    breakdown: {
      sportMatch:       sportPts,
      budgetFit:        budgetPts,
      engagementQuality: engagementPts,
      profileQuality:   profilePts,
      reputation:       ratingPts,
    },
  };
};

module.exports = { calculateMatchScore };
