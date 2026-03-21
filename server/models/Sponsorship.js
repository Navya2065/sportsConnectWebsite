const mongoose = require('mongoose');

const sponsorshipSchema = new mongoose.Schema(
  {
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'completed'],
      default: 'pending',
    },
    deal: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      value: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sponsorship', sponsorshipSchema);