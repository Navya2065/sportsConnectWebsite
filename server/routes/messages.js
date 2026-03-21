const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/messages/:conversationId
// @desc    Get all messages in a conversation
// @access  Private
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: req.params.conversationId,
    })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages/:conversationId
// @desc    Send a text message
// @access  Private
router.post('/:conversationId', protect, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: content.trim(),
      messageType: 'text',
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name avatar role'
    );

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/messages/:conversationId/file
// @desc    Send a file/image message
// @access  Private
router.post('/:conversationId/file', protect, upload.single('file'), async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const fileUrl = `/uploads/${req.file.filename}`;

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user._id,
      content: req.body.caption || '',
      messageType: isImage ? 'image' : 'file',
      fileUrl,
      fileName: req.file.originalname,
    });

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id).populate(
      'sender',
      'name avatar role'
    );

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message (own messages only)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;