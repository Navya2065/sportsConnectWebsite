const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['achievement', 'opportunity', 'general'],
      required: true,
    },
    content: { type: String, required: true, trim: true },
    images: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    shares: { type: Number, default: 0 },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Opportunity-specific fields (for sponsor posts)
    opportunity: {
      sport: { type: String, default: '' },
      budget: { type: String, default: '' },
      requirements: { type: String, default: '' },
      deadline: { type: Date },
    },

    tags: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);