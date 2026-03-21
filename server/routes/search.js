const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// @route   GET /api/search?q=query&type=users|posts|all
// @desc    Global search
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ users: [], posts: [], hashtags: [] });
    }

    const skip = (page - 1) * limit;
    const regex = { $regex: q, $options: 'i' };

    let users = [];
    let posts = [];

    if (type === 'all' || type === 'users') {
      users = await User.find({
        _id: { $ne: req.user._id },
        isActive: true,
        $or: [
          { name: regex },
          { sport: regex },
          { company: regex },
          { industry: regex },
          { bio: regex },
          { location: regex },
        ],
      })
        .select('name avatar role sport company isVerified followers')
        .limit(Number(limit))
        .skip(skip);
    }

    if (type === 'all' || type === 'posts') {
      posts = await Post.find({
        $or: [
          { content: regex },
          { tags: regex },
        ],
      })
        .populate('author', 'name avatar role isVerified')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);
    }

    // Trending hashtags from recent posts
    const recentPosts = await Post.find({}).select('tags').limit(100);
    const tagCounts = {};
    recentPosts.forEach(p => {
      p.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(q.toLowerCase())) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });
    const hashtags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ users, posts, hashtags });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/search/trending
// @desc    Get trending hashtags
// @access  Private
router.get('/trending', protect, async (req, res) => {
  try {
    const recentPosts = await Post.find({}).select('tags').limit(200);
    const tagCounts = {};
    recentPosts.forEach(p => {
      p.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const trending = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ trending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;