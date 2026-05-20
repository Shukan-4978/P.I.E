const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Startup = require('../models/Startup');

const { auth } = require('../middleware/auth');

// GET /api/search?q=&type=
router.get('/', auth, async (req, res, next) => {
  try {
    const { q, type = 'all', limit = 10 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    const regex = new RegExp(q.trim(), 'i');
    const results = {};

    if (type === 'all' || type === 'users') {
      const userQuery = {
        $or: [{ name: regex }, { bio: regex }, { company: regex }],
        _id: { $ne: req.user._id } // Exclude self
      };

      // Removed role-based restrictions as per user request to allow everyone to search everyone

      results.users = await User.find(userQuery)
        .select('name avatar role bio company location isVerified')
        .limit(Number(limit));
    }

    if (type === 'all' || type === 'startups') {
      results.startups = await Startup.find({
        isApproved: true,
        $or: [{ title: regex }, { tagline: regex }, { description: regex }, { tags: regex }],
      })
        .populate('founder', 'name avatar isVerified')
        .select('title tagline industry stage logo fundingGoal founder')
        .limit(Number(limit));
    }

    if (type === 'all' || type === 'investments') {
      results.investments = await User.aggregate([
        { $unwind: '$pastInvestments' },
        { 
          $match: { 
            'pastInvestments.status': 'accepted',
            $or: [
              { 'pastInvestments.companyName': regex },
              { 'pastInvestments.sector': regex }
            ]
          }
        },
        { $limit: Number(limit) },
        { 
          $project: {
            _id: '$pastInvestments._id',
            investorId: '$_id',
            investorName: '$name',
            investorAvatar: '$avatar',
            companyName: '$pastInvestments.companyName',
            sector: '$pastInvestments.sector',
            round: '$pastInvestments.round',
            amount: '$pastInvestments.amount'
          }
        }
      ]);
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
