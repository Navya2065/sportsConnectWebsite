const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @route   GET /api/conversations
// @desc    Get all conversations for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name avatar role sport company')
      .populate('lastMessage', 'content messageType createdAt')
      .sort({ lastMessageAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/conversations
// @desc    Create or get existing conversation between two users
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    })
      .populate('participants', 'name avatar role sport company')
      .populate('lastMessage', 'content messageType createdAt');

    if (conversation) {
      return res.json({ conversation });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [req.user._id, recipientId],
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name avatar role sport company')
      .populate('lastMessage', 'content messageType createdAt');

    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/conversations/:id
// @desc    Get single conversation by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    }).populate('participants', 'name avatar role sport company');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;