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

    // Athlete-specific fields
    sport: { type: String, default: '' },
    achievements: [{ type: String }],
    location: { type: String, default: '' },
    bio: { type: String, default: '' },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
    },

    // Sponsor-specific fields
    company: { type: String, default: '' },
    industry: { type: String, default: '' },
    website: { type: String, default: '' },
    sponsorshipBudget: { type: String, default: '' },
    interestedSports: [{ type: String }],

    isActive: { type: Boolean, default: true },

    // Follow system
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Verified badge
    isVerified: { type: Boolean, default: false },
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