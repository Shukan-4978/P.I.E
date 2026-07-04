const express = require('express');
const router = express.Router();
const Startup = require('../models/Startup');
const Post = require('../models/Post');
const { auth, requireRole } = require('../middleware/auth');
const { uploadImage, uploadStartupFiles } = require('../middleware/upload');
const { createNotification } = require('../services/notificationService');
const { checkLimit } = require('../middleware/limitMiddleware');

// POST /api/startups — create startup
router.post('/', auth, requireRole('founder'), checkLimit('startups'), uploadStartupFiles.fields([{ name: 'images', maxCount: 5 }, { name: 'verificationDocument', maxCount: 1 }, { name: 'logo', maxCount: 1 }]), async (req, res, next) => {
  try {
    const data = { ...req.body, founder: req.user._id };
    
    // Handle images
    if (req.files && req.files['images']) {
      data.images = req.files['images'].map((f) => f.path);
    }
    
    // Handle logo
    if (req.files && req.files['logo']) {
      data.logo = req.files['logo'][0].path;
    }
    
    // Handle verification document
    if (req.files && req.files['verificationDocument']) {
      data.verificationDocument = req.files['verificationDocument'][0].path;
    }

    if (data.teamMembers) data.teamMembers = JSON.parse(data.teamMembers);
    if (data.traction) data.traction = JSON.parse(data.traction);

    const startup = await Startup.create(data);
    res.status(201).json(startup);
  } catch (err) {
    next(err);
  }
});

// GET /api/startups — feed with filters
router.get('/', async (req, res, next) => {
  try {
    const { industry, stage, location, sort = 'latest', page = 1, limit = 12, search, category, q } = req.query;
    const query = { isApproved: true };

    const targetIndustry = industry || category;
    if (targetIndustry && targetIndustry !== 'All') {
      const sanitized = targetIndustry.replace(/[^a-zA-Z0-9]/g, '');
      const regexStr = sanitized.split('').join('[- ]?');
      query.industry = new RegExp(regexStr, 'i');
    }
    const targetSearch = search || q;
    if (targetSearch) {
      query.$or = [
        { title: new RegExp(targetSearch, 'i') },
        { tagline: new RegExp(targetSearch, 'i') },
        { description: new RegExp(targetSearch, 'i') },
        { industry: new RegExp(targetSearch, 'i') }
      ];
    }
    if (stage) query.stage = stage;
    if (location) query.location = new RegExp(location, 'i');
    const sortOptions = {
      latest: { createdAt: -1 },
      popular: { views: -1 },
      funding: { fundingGoal: -1 },
    };

    const startups = await Startup.find(query)
      .populate('founder', 'name avatar role company')
      .sort(sortOptions[sort] || { createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Startup.countDocuments(query);

    res.json({
      startups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/public/list — public preview list for landing page (no auth)
router.get('/public/list', async (req, res, next) => {
  try {
    const startups = await Startup.find({ isApproved: true })
      .select('title tagline industry stage location logo images fundingGoal views createdAt')
      .populate('founder', 'name avatar company')
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ startups });
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/public/stats — real-time landing page stats
router.get('/public/stats', async (req, res, next) => {
  try {
    const [startupsCount, investorsCount, raisedResult] = await Promise.all([
      Startup.countDocuments({ isApproved: true }),
      require('../models/User').countDocuments({ role: 'investor' }),
      Startup.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: null, totalRaised: { $sum: "$raisedSoFar" } } }
      ])
    ]);

    const totalRaised = raisedResult[0]?.totalRaised || 0;
    
    // A heuristic for match rate based on connections or basic ratio
    const matchRate = startupsCount > 0 ? Math.min(99, Math.floor(70 + (investorsCount / startupsCount) * 15)) : 0;
    
    res.json({
      startups: startupsCount,
      investors: investorsCount,
      raised: totalRaised,
      matchRate: matchRate + '%'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/my — founder's own startups
router.get('/my', auth, requireRole('founder'), async (req, res, next) => {
  try {
    const startups = await Startup.find({ founder: req.user._id }).sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/user/:userId — get startups of a specific founder
router.get('/user/:userId', auth, async (req, res, next) => {
  try {
    const isOwner = req.user._id.toString() === req.params.userId;
    const query = { founder: req.params.userId };
    if (!isOwner) {
      query.isApproved = true;
    }
    const startups = await Startup.find(query).sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('founder', 'name avatar bio location linkedIn company followers');

    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    const isOwner = req.user._id.toString() === startup.founder._id.toString();
    const isConnected = isOwner || startup.founder.followers?.some(f => f.toString() === req.user._id.toString());

    // If investor and not connected, strip sensitive data
    const responseData = startup.toObject();
    responseData.isConnected = isConnected;

    if (!isConnected && req.user.role === 'investor') {
      delete responseData.traction;
      delete responseData.revenue;
      delete responseData.valuation;
      delete responseData.equity;
      delete responseData.teamMembers;
      delete responseData.investmentOffers;
      // Keep title, tagline, description, industry, stage, location
    }

    res.json(responseData);
  } catch (err) {
    next(err);
  }
});

// PUT /api/startups/:id
router.put('/:id', auth, requireRole('founder'), uploadStartupFiles.fields([{ name: 'images', maxCount: 5 }, { name: 'logo', maxCount: 1 }]), async (req, res, next) => {
  try {
    const startup = await Startup.findOne({ _id: req.params.id, founder: req.user._id });
    if (!startup) return res.status(404).json({ error: 'Startup not found or unauthorized.' });

    const updates = { ...req.body };
    
    if (req.files && req.files['images']) {
      updates.images = req.files['images'].map((f) => f.path);
    }
    if (req.files && req.files['logo']) {
      updates.logo = req.files['logo'][0].path;
    }
    
    if (updates.teamMembers) updates.teamMembers = JSON.parse(updates.teamMembers);
    if (updates.traction) updates.traction = JSON.parse(updates.traction);

    Object.assign(startup, updates);
    await startup.save();
    res.json(startup);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/startups/:id
router.delete('/:id', auth, requireRole('founder'), async (req, res, next) => {
  try {
    const startup = await Startup.findOneAndDelete({ _id: req.params.id, founder: req.user._id });
    if (!startup) return res.status(404).json({ error: 'Startup not found or unauthorized.' });
    res.json({ message: 'Startup deleted.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/startups/:id/bookmark
router.post('/:id/bookmark', auth, async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    const isBookmarked = startup.bookmarks.includes(req.user._id);
    if (isBookmarked) {
      startup.bookmarks.pull(req.user._id);
    } else {
      startup.bookmarks.push(req.user._id);
    }
    await startup.save();
    res.json({ bookmarked: !isBookmarked, count: startup.bookmarks.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/startups/bookmarked — investor saved startups
router.get('/user/bookmarked', auth, async (req, res, next) => {
  try {
    const startups = await Startup.find({ bookmarks: req.user._id })
      .populate('founder', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(startups);
  } catch (err) {
    next(err);
  }
});

// POST /api/startups/:id/offer — send investment offer
router.post('/:id/offer', auth, requireRole('investor'), async (req, res, next) => {
  try {
    const { amount, message } = req.body;
    const startup = await Startup.findById(req.params.id).populate('founder');
    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    startup.investmentOffers.push({ investor: req.user._id, amount, message });
    await startup.save();

    // Notify founder
    const io = req.app.get('io');
    await createNotification({
      recipient: startup.founder._id,
      sender: req.user._id,
      type: 'investment_offer',
      title: 'New Investment Offer!',
      body: `${req.user.name} sent a $${amount.toLocaleString()} investment offer for ${startup.title}`,
      entityId: startup._id,
      entityModel: 'Startup',
      link: `/startups/${startup._id}`,
      io,
    });

    res.json({ message: 'Investment offer sent.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
