const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    // One contract per sponsorship deal
    sponsorship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsorship',
      required: true,
      unique: true,
    },

    // Auto-generated unique contract number: SC-2025-0001
    contractNumber: {
      type: String,
      unique: true,
    },

    // Type of sponsorship agreement
    templateType: {
      type: String,
      enum: ['brand_ambassador', 'social_media', 'event_appearance'],
      default: 'brand_ambassador',
    },

    // Sponsor can add extra clauses
    customTerms: { type: String, default: '' },

    // Lifecycle: draft → pending_athlete → fully_signed | voided
    status: {
      type: String,
      enum: ['draft', 'pending_athlete', 'fully_signed', 'voided'],
      default: 'draft',
    },

    // Sponsor signs first (they generate the contract)
    sponsorSignature: {
      name:     { type: String, default: '' },
      signedAt: { type: Date },
    },

    // Athlete signs second
    athleteSignature: {
      name:     { type: String, default: '' },
      signedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Auto-generate contract number before first save
contractSchema.pre('save', async function (next) {
  if (this.contractNumber) return next();
  const year  = new Date().getFullYear();
  const count = await mongoose.model('Contract').countDocuments();
  this.contractNumber = `SC-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Contract', contractSchema);
