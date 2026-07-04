const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Startup = require('../models/Startup');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { createNotification } = require('../services/notificationService');
const { checkLimit } = require('../middleware/limitMiddleware');

// POST /api/posts
router.post('/', auth, checkLimit('posts'), uploadImage.array('images', 4), async (req, res, next) => {
  try {
    const { content, startup, type, tags } = req.body;
    const images = req.files ? req.files.map((f) => f.path) : [];

    const post = await Post.create({
      author: req.user._id,
      content,
      startup: startup || undefined,
      type: type || 'general',
      images,
      tags: tags ? JSON.parse(tags) : [],
    });

    await post.populate('author', 'name avatar role company isVerified');
    if (post.startup) await post.populate('startup', 'title industry stage');

    // Emit to feed via socket
    const io = req.app.get('io');
    if (io) io.emit('new_post', post);

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/feed — paginated feed
router.get('/feed', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pendingStartups = await Startup.find({ isApproved: false }).select('_id');
    const pendingIds = pendingStartups.map(s => s._id);

    const query = {
      isVisible: true,
      $nor: [
        { startup: { $in: pendingIds } }
      ]
    };

    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // If user is founder, hide posts from investors EXCEPT for intros
    if (req.user.role === 'founder') {
      const investors = await User.find({ role: 'investor' }).select('_id');
      const investorIds = investors.map(u => u._id);
      const founderFilter = {
        $or: [
          { author: { $nin: investorIds } },
          { type: 'investor_intro' }
        ]
      };
      // Combine with search query if exists
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          founderFilter
        ];
        delete query.$or;
      } else {
        query.$or = founderFilter.$or;
      }
    }

    let posts = await Post.find(query)
      .populate('author', 'name avatar role company followers connectionRequests pastInvestments isVerified')
      .populate('startup', 'title industry stage logo fundingGoal valuation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // For investors, move funding_need posts to the top of the current page
    if (req.user.role === 'investor') {
      posts = [
        ...posts.filter(p => p.type === 'funding_need'),
        ...posts.filter(p => p.type !== 'funding_need')
      ];
    }

    const total = await Post.countDocuments(query);
    res.json({
      posts,
      hasMore: page * limit < total,
      total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/saved
router.get('/saved', auth, async (req, res, next) => {
  try {
    const posts = await Post.find({ saves: req.user._id })
      .populate('author', 'name avatar role isVerified')
      .populate('startup', 'title industry')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/user/:userId
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ author: req.params.userId, isVisible: true })
      .populate('author', 'name avatar role isVerified')
      .populate('startup', 'title industry')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name avatar role company bio isVerified')
      .populate('startup', 'title industry stage logo')
      .populate('comments.author', 'name avatar isVerified');

    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/like
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '_id');
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
      // Notify post author
      if (post.author._id.toString() !== req.user._id.toString()) {
        const io = req.app.get('io');
        await createNotification({
          recipient: post.author._id,
          sender: req.user._id,
          type: 'like',
          title: 'New Like',
          body: `${req.user.name} liked your post`,
          entityId: post._id,
          entityModel: 'Post',
          link: `/feed?post=${post._id}`,
          io,
        });
      }
    }
    await post.save();
    res.json({ liked: !isLiked, count: post.likes.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/save
router.post('/:id/save', auth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const isSaved = post.saves.includes(req.user._id);
    if (isSaved) {
      post.saves.pull(req.user._id);
    } else {
      post.saves.push(req.user._id);
    }
    await post.save();
    res.json({ saved: !isSaved, count: post.saves.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content required.' });

    const post = await Post.findById(req.params.id).populate('author', '_id');
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    const comment = { author: req.user._id, content };
    post.comments.push(comment);
    await post.save();

    await post.populate('comments.author', 'name avatar');
    const newComment = post.comments[post.comments.length - 1];

    if (post.author._id.toString() !== req.user._id.toString()) {
      const io = req.app.get('io');
      await createNotification({
        recipient: post.author._id,
        sender: req.user._id,
        type: 'comment',
        title: 'New Comment',
        body: `${req.user.name} commented on your post`,
        entityId: post._id,
        entityModel: 'Post',
        link: `/feed?post=${post._id}`,
        io,
      });
    }

    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    });
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
