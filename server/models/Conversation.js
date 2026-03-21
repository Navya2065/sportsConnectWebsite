const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure only 2 participants per conversation
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('A conversation must have exactly 2 participants'));
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);