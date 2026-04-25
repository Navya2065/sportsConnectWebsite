const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // One review per party per deal
    sponsorship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsorship',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    // Optional written review
    review: {
      type: String,
      default: '',
      maxlength: 600,
    },
    // Quick highlight tags chosen by reviewer
    highlights: [{ type: String }],

    // Role of the reviewer at time of review
    reviewerRole: {
      type: String,
      enum: ['sponsor', 'athlete'],
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate: one reviewer per sponsorship deal
reviewSchema.index({ reviewer: 1, sponsorship: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
