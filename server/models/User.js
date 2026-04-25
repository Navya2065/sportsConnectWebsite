const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['athlete', 'sponsor'],
      required: [true, 'Role is required'],
    },
    avatar: {
      type: String,
      default: '',
    },

    // ─── Athlete-specific fields ─────────────────────────────────
    sport:        { type: String, default: '' },
    achievements: [{ type: String }],
    location:     { type: String, default: '' },
    bio:          { type: String, default: '' },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter:   { type: String, default: '' },
      youtube:   { type: String, default: '' },
    },

    // Athlete performance stats (self-reported / auto-computed)
    stats: {
      engagementRate: { type: Number, default: 0 },  // percentage, e.g. 4.5
      monthlyViews:   { type: Number, default: 0 },  // e.g. 120000
    },

    // Media Kit — for sponsors to evaluate
    mediaKit: {
      headline:     { type: String, default: '' },   // e.g. "Professional Sprinter | 4× National Champion"
      highlights:   [{ type: String }],              // bullet points
      pricing:      { type: String, default: '' },   // e.g. "₹50k–₹2L per campaign"
      availability: { type: String, default: '' },   // e.g. "Available from Jan 2026"
    },

    // Asking price (numeric, for filter matching)
    askingPriceMin: { type: Number, default: 0 },
    askingPriceMax: { type: Number, default: 0 },
    priceCurrency:  { type: String, default: 'INR' },

    // Manually added previous sponsors (brands before joining platform)
    previousSponsors: [
      {
        brandName:   { type: String, required: true },
        year:        { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],

    // Portfolio media (photos / videos)
    portfolioMedia: [
      {
        url:       { type: String, required: true },
        mediaType: { type: String, enum: ['photo', 'video'], default: 'photo' },
        caption:   { type: String, default: '' },
      },
    ],

    // ─── Sponsor-specific fields ──────────────────────────────────
    company:          { type: String, default: '' },
    industry:         { type: String, default: '' },
    website:          { type: String, default: '' },
    sponsorshipBudget:{ type: String, default: '' },
    interestedSports: [{ type: String }],

    isActive: { type: Boolean, default: true },

    // ─── Ratings (computed from reviews) ─────────────────────────
    averageRating: { type: Number, default: 0 },
    reviewCount:   { type: Number, default: 0 },

    // ─── Follow system ────────────────────────────────────────────
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ─── Verified badge ───────────────────────────────────────────
    isVerified:   { type: Boolean, default: false },
    verifiedType: { type: String, enum: ['athlete', 'sponsor', ''], default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
