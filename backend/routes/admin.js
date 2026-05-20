const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Startup = require('../models/Startup');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const { auth, requireRole } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(auth, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalStartups, totalPosts, pendingStartups, pendingReports, founders, investors, totalInvestments, pendingInvestments, totalProfit] =
      await Promise.all([
        User.countDocuments(),
        Startup.countDocuments(),
        Post.countDocuments(),
        Startup.countDocuments({ isApproved: false, isRejected: false }),
        Report.countDocuments({ status: 'pending' }),
        User.countDocuments({ role: 'founder' }),
        User.countDocuments({ role: 'investor' }),
        User.aggregate([{ $unwind: '$pastInvestments' }, { $count: 'total' }]).then(res => res[0]?.total || 0),
        User.aggregate([{ $unwind: '$pastInvestments' }, { $match: { 'pastInvestments.status': 'pending' } }, { $count: 'total' }]).then(res => res[0]?.total || 0),
        Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]).then(res => res[0]?.total || 0),
      ]);

    // Monthly growth (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent activity
    const [recentUsers, recentStartups, recentReports, recentInvestments] = await Promise.all([
      User.find().select('name email avatar role createdAt').sort({ createdAt: -1 }).limit(5),
      Startup.find().populate('founder', 'name').sort({ createdAt: -1 }).limit(5),
      Report.find({ status: 'pending' }).populate('reporter', 'name').sort({ createdAt: -1 }).limit(5),
      User.aggregate([
        { $unwind: '$pastInvestments' },
        { $sort: { 'pastInvestments.createdAt': -1 } },
        { $limit: 5 },
        { $project: { _id: 1, name: 1, email: 1, avatar: 1, investment: '$pastInvestments' } }
      ])
    ]);

    res.json({
      totalUsers, totalStartups, totalPosts,
      pendingStartups, pendingReports, founders, investors,
      totalInvestments, pendingInvestments,
      totalProfit,
      monthlyGrowth,
      recentUsers, recentStartups, recentReports, recentInvestments,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$text = { $search: search };

    const users = await User.find(query)
      .select('-password')
      .select('+subscriptionPlan +subscriptionStatus')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });
    res.json({ blocked: user.isBlocked, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.` });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/upgrade
router.put('/users/:id/upgrade', async (req, res, next) => {
  try {
    const { plan } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.subscriptionPlan = plan;
    user.subscriptionStatus = 'active';
    await user.save({ validateBeforeSave: false });

    // Record manual transaction
    await Transaction.create({
      type: 'subscription',
      amount: 0, // Manual upgrade is free/zero-cost record
      user: user._id,
      status: 'completed',
      metadata: { plan, manualUpgrade: true, adminId: req.user._id }
    });

    res.json({ success: true, message: `User upgraded to ${plan}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/startups — pending moderation queue
router.get('/startups', async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = status === 'pending'
      ? { isApproved: false, isRejected: false }
      : status === 'approved'
      ? { isApproved: true }
      : { isRejected: true };

    const startups = await Startup.find(query)
      .populate('founder', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Startup.countDocuments(query);
    res.json({ startups, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/startups/:id/approve
router.put('/startups/:id/approve', async (req, res, next) => {
  try {
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isRejected: false, rejectionReason: '' },
      { new: true }
    ).populate('founder', '_id name');

    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    const io = req.app.get('io');
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      recipient: startup.founder._id,
      type: 'startup_approved',
      title: '🎉 Startup Approved!',
      body: `Your startup "${startup.title}" has been approved and is now live.`,
      entityId: startup._id,
      entityModel: 'Startup',
      link: `/startups/${startup._id}`,
      io,
    });

    res.json(startup);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/startups/:id/reject
router.put('/startups/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const startup = await Startup.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isRejected: true, rejectionReason: reason || '' },
      { new: true }
    ).populate('founder', '_id name');

    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    const io = req.app.get('io');
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      recipient: startup.founder._id,
      type: 'startup_rejected',
      title: 'Startup Needs Updates',
      body: `Your startup "${startup.title}" requires changes: ${reason || 'See guidelines.'}`,
      entityId: startup._id,
      entityModel: 'Startup',
      link: `/startups/my`,
      io,
    });

    res.json(startup);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports
router.get('/reports', async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const reports = await Report.find({ status })
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Report.countDocuments({ status });
    res.json({ reports, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/reports/:id
router.put('/reports/:id', async (req, res, next) => {
  try {
    const { status, resolution } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolution, resolvedBy: req.user._id },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Notify reporter
    const io = req.app.get('io');
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      recipient: report.reporter,
      type: 'report_resolved',
      title: 'Report Update',
      body: `Your report has been reviewed and resolved: ${resolution || 'Appropriate action taken.'}`,
      io,
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/ai-analyses
router.get('/ai-analyses', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const analyses = await require('../models/AIAnalysis').find()
      .populate('uploadedBy', 'name email avatar')
      .populate('startup', 'title logo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await require('../models/AIAnalysis').countDocuments();
    res.json({ analyses, total });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/payments
router.get('/payments', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const [transactions, total, stats] = await Promise.all([
      Transaction.find()
        .populate('user', 'name email avatar')
        .populate('investor', 'name')
        .populate('founder', 'name')
        .populate('startup', 'title')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { 
          $group: { 
            _id: '$type', 
            count: { $sum: 1 }, 
            revenue: { $sum: '$amount' } 
          } 
        }
      ])
    ]);

    res.json({ transactions, total, stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/investments
router.get('/investments', async (req, res, next) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    // Aggregate to get only the matching pastInvestments
    const users = await User.aggregate([
      { $unwind: '$pastInvestments' },
      { $match: { 'pastInvestments.status': status } },
      { $sort: { 'pastInvestments.createdAt': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) },
      { $project: {
          _id: 1, name: 1, email: 1, avatar: 1,
          investment: '$pastInvestments'
      }}
    ]);

    const totalPipeline = await User.aggregate([
      { $unwind: '$pastInvestments' },
      { $match: { 'pastInvestments.status': status } },
      { $count: 'total' }
    ]);
    const total = totalPipeline.length > 0 ? totalPipeline[0].total : 0;

    res.json({ investments: users, total });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/investments/:userId/:investmentId/approve
router.put('/investments/:userId/:investmentId/approve', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const investment = user.pastInvestments.id(req.params.investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    investment.status = 'accepted';
    investment.rejectionReason = '';
    await user.save({ validateBeforeSave: false });

    // Notify user
    const io = req.app.get('io');
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      recipient: user._id,
      type: 'investment_approved',
      title: 'Investment Approved',
      body: `Your investment in ${investment.companyName} has been approved and is now public.`,
      link: '/investor/portfolio',
      io,
    });

    res.json({ message: 'Investment approved' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/investments/:userId/:investmentId/reject
router.put('/investments/:userId/:investmentId/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const investment = user.pastInvestments.id(req.params.investmentId);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    investment.status = 'rejected';
    investment.rejectionReason = reason || 'Proof verification failed';
    await user.save({ validateBeforeSave: false });

    // Notify user
    const io = req.app.get('io');
    const { createNotification } = require('../services/notificationService');
    await createNotification({
      recipient: user._id,
      type: 'investment_rejected',
      title: 'Investment Rejected',
      body: `Your investment in ${investment.companyName} was rejected: ${investment.rejectionReason}`,
      link: '/investor/portfolio',
      io,
    });

    res.json({ message: 'Investment rejected' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
