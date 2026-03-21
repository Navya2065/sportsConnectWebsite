const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (type) query.type = type;
    const posts = await Post.find(query)
      .populate('author', 'name avatar role sport company isVerified')
      .populate('comments.user', 'name avatar role')
      .populate('applicants', 'name avatar sport')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Post.countDocuments(query);
    res.json({ posts, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { content, type, tags, opportunity } = req.body;
    if (!content || !type) return res.status(400).json({ message: 'Content and type are required' });
    if (type === 'opportunity' && req.user.role !== 'sponsor') return res.status(403).json({ message: 'Only sponsors can post opportunities' });
    if (type === 'achievement' && req.user.role !== 'athlete') return res.status(403).json({ message: 'Only athletes can post achievements' });
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    const post = await Post.create({
      author: req.user._id, content, type, images,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      opportunity: opportunity ? JSON.parse(opportunity) : {},
    });
    const populated = await Post.findById(post._id)
      .populate('author', 'name avatar role sport company isVerified');
    res.status(201).json({ post: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          message: `${req.user.name} liked your post`,
        });
      }
    }
    await post.save();
    res.json({ likes: post.likes, liked: !alreadyLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ user: req.user._id, content: content.trim() });
    await post.save();
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        message: `${req.user.name} commented on your post`,
      });
    }
    const updated = await Post.findById(req.params.id).populate('comments.user', 'name avatar role');
    res.status(201).json({ comments: updated.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id/comment/:commentId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/share', protect, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/apply', protect, async (req, res) => {
  try {
    if (req.user.role !== 'athlete') return res.status(403).json({ message: 'Only athletes can apply' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.type !== 'opportunity') return res.status(400).json({ message: 'This post is not an opportunity' });
    if (post.applicants.includes(req.user._id)) return res.status(400).json({ message: 'Already applied' });
    post.applicants.push(req.user._id);
    await post.save();
    await Notification.create({
      recipient: post.author,
      sender: req.user._id,
      type: 'apply',
      post: post._id,
      message: `${req.user.name} applied to your sponsorship opportunity`,
    });
    res.json({ message: 'Applied successfully', applicants: post.applicants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;