const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  athlete:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pitch:       { type: String, default: '' },
  askingRate:  { type: Number, default: 0 },
  status:      { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  appliedAt:   { type: Date, default: Date.now },
});

const inviteSchema = new mongoose.Schema({
  athlete:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:  { type: String, default: '' },
  status:   { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  sentAt:   { type: Date, default: Date.now },
});

const campaignSchema = new mongoose.Schema({
  sponsor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  sport:         { type: String, default: '' },
  budget:        { type: Number, required: true },
  currency:      { type: String, default: 'INR' },
  slots:         { type: Number, default: 1 },
  filledSlots:   { type: Number, default: 0 },
  startDate:     { type: Date },
  endDate:       { type: Date },
  deliverables:  { type: String, default: '' },   // free text
  status:        { type: String, enum: ['open','closed','completed'], default: 'open' },
  applications:  [applicationSchema],
  invites:       [inviteSchema],
}, { timestamps: true });

// virtual: open slots left
campaignSchema.virtual('slotsLeft').get(function () {
  return Math.max(0, this.slots - this.filledSlots);
});

module.exports = mongoose.model('Campaign', campaignSchema);
