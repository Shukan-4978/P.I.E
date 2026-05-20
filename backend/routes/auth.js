const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { uploadAvatar, uploadProof } = require('../middleware/upload');
const { createNotification } = require('../services/notificationService');
const { sendEmailOTP } = require('../services/emailService');
const { sendSMSOTP } = require('../services/smsService');
const { checkLimit, PLAN_LIMITS } = require('../middleware/limitMiddleware');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// GET /api/auth/public/investors — public preview list for landing page (no auth)
router.get('/public/investors', async (req, res, next) => {
  try {
    const investors = await User.find({ role: 'investor' })
      .select('name avatar bio company location investmentFocus investmentRange industries followers createdAt isVerified')
      .sort({ createdAt: -1 })
      .limit(8);
    res.json({ investors });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/limits
router.get('/limits', auth, (req, res) => {
  res.json(PLAN_LIMITS);
});

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['founder', 'investor']).withMessage('Role must be founder or investor'),
    body('phone').notEmpty().withMessage('Phone number is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, email, password, role, phone, agreedToTerms } = req.body;
      
      if (!agreedToTerms) {
        return res.status(400).json({ error: 'You must agree to the Terms and Conditions.' });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const emailCode = Math.floor(100000 + Math.random() * 900000).toString();
      const phoneCode = Math.floor(100000 + Math.random() * 900000).toString();

      const user = await User.create({ 
        name, 
        email, 
        password, 
        role,
        phone,
        agreedToTerms: true,
        agreedAt: new Date(),
        emailVerificationCode: emailCode,
        phoneVerificationCode: phoneCode,
        isEmailVerified: false,
        isPhoneVerified: false
      });

      // Send OTPs asynchronously
      try {
        await sendEmailOTP(email, emailCode);
        await sendSMSOTP(phone, phoneCode);
      } catch (err) {
        console.error('Failed to send initial OTPs', err);
        // Continue anyway, user can request again
      }

      const token = generateToken(user._id);

      res.status(201).json({ token, user, message: 'Account created. Please verify your email and phone.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: 'Your account has been suspended.' });
      }

      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });

      const token = generateToken(user._id);
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'name avatar role')
      .populate('following', 'name avatar role');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, uploadAvatar.single('avatar'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const updates = {};
    
    // Ensure usageStats exists and is up to date
    if (!user.usageStats) {
      user.usageStats = {
        messagesToday: { count: 0, lastReset: new Date() },
        connectionsMonth: { count: 0, lastReset: new Date() },
        postsMonth: { count: 0, lastReset: new Date() },
        startupsMonth: { count: 0, lastReset: new Date() },
        investmentsMonth: { count: 0, lastReset: new Date() },
        aiAnalysisMonth: { count: 0, lastReset: new Date() },
        aiAdvisorMessagesMonth: { count: 0, lastReset: new Date() }
      };
      updates['usageStats'] = user.usageStats;
    }
    const plan = user.subscriptionPlan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];

    const allowed = ['name', 'bio', 'location', 'website', 'linkedIn', 'twitter', 'company', 'investmentFocus', 'industries', 'notificationSettings'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.investmentRange) {
      try {
        updates.investmentRange = typeof req.body.investmentRange === 'string' ? JSON.parse(req.body.investmentRange) : req.body.investmentRange;
      } catch (e) {}
    }
    if (req.body.pastInvestments) {
      try {
        const newInvestments = typeof req.body.pastInvestments === 'string' ? JSON.parse(req.body.pastInvestments) : req.body.pastInvestments;
        
        // Count new additions this month
        const existingCount = (user.pastInvestments && user.pastInvestments.length) || 0;
        const incomingCount = (newInvestments && newInvestments.length) || 0;
        
        if (incomingCount > existingCount) {
          const additions = incomingCount - existingCount;
          const stats = user.usageStats;
          const now = new Date();

          if (!stats.investmentsMonth) {
            stats.investmentsMonth = { count: 0, lastReset: now };
          }

          const lrDate = new Date(stats.investmentsMonth.lastReset);
          
          // Reset count if new month
          if (now.getMonth() !== lrDate.getMonth() || now.getFullYear() !== lrDate.getFullYear()) {
            stats.investmentsMonth.count = 0;
            stats.investmentsMonth.lastReset = now;
          }

          // Check against plan limit
          /* Temporarily disabled limits
          if (stats.investmentsMonth.count + additions > limits.investments) {
            return res.status(403).json({ 
              error: `Investment limit reached. Your ${plan} plan allows ${limits.investments} new investment(s) per month. You have already added ${stats.investmentsMonth.count} this month.`,
              limitReached: true,
              type: 'investments',
              plan
            });
          }
          */
          
          // Increment and mark for update
          stats.investmentsMonth.count += additions;
          updates['usageStats.investmentsMonth'] = stats.investmentsMonth;
        }
        
        updates.pastInvestments = newInvestments;
      } catch (e) {
        console.error('Investment limit check error:', e);
      }
    }
    if (req.body.investmentFocus) {
      try {
        updates.investmentFocus = typeof req.body.investmentFocus === 'string' ? JSON.parse(req.body.investmentFocus) : req.body.investmentFocus;
      } catch (e) {}
    }
    if (req.body.industries) {
      try {
        updates.industries = typeof req.body.industries === 'string' ? JSON.parse(req.body.industries) : req.body.industries;
      } catch (e) {}
    }
    if (req.body.notificationSettings) {
      try {
        updates.notificationSettings = typeof req.body.notificationSettings === 'string' ? JSON.parse(req.body.notificationSettings) : req.body.notificationSettings;
      } catch (e) {}
    }

    if (req.file) {
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: false }
    )
      .populate('followers', 'name avatar role')
      .populate('following', 'name avatar role');
    res.json(updatedUser);

  } catch (err) {
    next(err);
  }
});

// POST /api/auth/investments (Add an investment track record)
router.post('/investments', auth, uploadProof.single('proof'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const plan = user.subscriptionPlan || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];

    if (!user.usageStats) user.usageStats = {};
    if (!user.usageStats.investmentsMonth) {
      user.usageStats.investmentsMonth = { count: 0, lastReset: new Date() };
    }

    const now = new Date();
    const lrDate = new Date(user.usageStats.investmentsMonth.lastReset);
    if (now.getMonth() !== lrDate.getMonth() || now.getFullYear() !== lrDate.getFullYear()) {
      user.usageStats.investmentsMonth.count = 0;
      user.usageStats.investmentsMonth.lastReset = now;
    }

    /* Temporarily disabled limits
    if (user.usageStats.investmentsMonth.count >= limits.investments) {
      return res.status(403).json({
        error: `Investment limit reached. Your ${plan} plan allows ${limits.investments} new investment(s) per month.`,
        limitReached: true
      });
    }
    */

    const newInvestment = {
      companyName: req.body.companyName,
      year: req.body.year,
      amount: req.body.amount,
      sector: req.body.sector,
      round: req.body.round,
      website: req.body.website,
      location: req.body.location,
      exitStatus: req.body.exitStatus || 'Active',
      status: 'pending',
      proof: req.file ? `/uploads/proofs/${req.file.filename}` : ''
    };

    user.pastInvestments.push(newInvestment);
    user.usageStats.investmentsMonth.count += 1;

    await user.save({ validateBeforeSave: false });
    
    // Notify admin
    const io = req.app.get('io');
    if (io) {
      const adminUsers = await User.find({ role: 'admin' });
      adminUsers.forEach(admin => {
        io.sendToUser(admin._id, 'notification', {
          title: 'New Investment Proof',
          body: `${user.name} submitted a new investment for review.`,
        });
      });
    }

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/investments/:id (Edit an investment)
router.put('/investments/:id', auth, uploadProof.single('proof'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const investment = user.pastInvestments.id(req.params.id);
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    const fields = ['companyName', 'year', 'amount', 'sector', 'round', 'website', 'location', 'exitStatus'];
    let changed = false;
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        investment[field] = req.body[field];
        changed = true;
      }
    });

    if (req.file) {
      investment.proof = `/uploads/proofs/${req.file.filename}`;
      changed = true;
    }

    if (changed) {
      // Re-trigger review if changed (unless just updating minor things, but let's assume it goes to pending again)
      investment.status = 'pending';
      investment.rejectionReason = '';
    }

    await user.save({ validateBeforeSave: false });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/investments/:id
router.delete('/investments/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.pastInvestments.pull(req.params.id);
    await user.save({ validateBeforeSave: false });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/change-password
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/verify/email/request
router.post('/verify/email/request', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isEmailVerified) return res.status(400).json({ error: 'Email already verified' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = code;
    await user.save({ validateBeforeSave: false });
    
    await sendEmailOTP(user.email, code);
    res.json({ 
      message: 'Verification code sent to your email.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify/email/confirm
router.post('/verify/email/confirm', auth, async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (user.isEmailVerified) return res.status(400).json({ error: 'Already verified' });
    if (user.emailVerificationCode !== code) return res.status(400).json({ error: 'Invalid code' });
    user.isEmailVerified = true;
    user.emailVerificationCode = '';
    
    if (user.isPhoneVerified) {
      user.isVerified = true;
    }
    
    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Email verified successfully.', user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify/phone/request
router.post('/verify/phone/request', auth, async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findById(req.user._id);
    
    // If phone is provided, update it. Otherwise use existing.
    const targetPhone = phone || user.phone;
    if (!targetPhone) return res.status(400).json({ error: 'Phone number required' });
    
    if (user.isPhoneVerified && user.phone === targetPhone) return res.status(400).json({ error: 'Phone already verified' });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.phone = targetPhone;
    user.phoneVerificationCode = code;
    user.isPhoneVerified = false; // Reset if they changed phone
    await user.save({ validateBeforeSave: false });
    
    await sendSMSOTP(targetPhone, code);
    res.json({ 
      message: 'Verification code sent to your phone.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify/phone/confirm
router.post('/verify/phone/confirm', auth, async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);
    if (user.isPhoneVerified) return res.status(400).json({ error: 'Already verified' });
    if (user.phoneVerificationCode !== code) return res.status(400).json({ error: 'Invalid code' });
    user.isPhoneVerified = true;
    user.phoneVerificationCode = '';
    
    if (user.isEmailVerified) {
      user.isVerified = true;
    }
    
    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Phone verified successfully.', user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/search-users - Search for users
router.get('/search-users', auth, async (req, res, next) => {
  try {
    const { q, role, category } = req.query;
    const query = { _id: { $ne: req.user._id } };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (category && category !== 'All') {
      query.$or = query.$or || [];
      // Flexible regex: allows optional hyphens or spaces between characters
      const sanitized = category.replace(/[^a-zA-Z0-9]/g, '');
      const regexStr = sanitized.split('').join('[- ]?');
      const regex = new RegExp(regexStr, 'i');
      query.$or.push(
        { industries: regex },
        { investmentFocus: regex }
      );
    }

    const users = await User.find(query)
      .select('name avatar role company bio followers following connectionRequests')
      .limit(20);
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/auth/suggested - Get suggested users to connect with

// GET /api/auth/suggested - Get suggested users to connect with
router.get('/suggested', auth, async (req, res, next) => {
  try {
    const roleToFind = req.user.role === 'founder' ? 'investor' : 'founder';
    const suggested = await User.find({
      role: roleToFind,
      _id: { $ne: req.user._id, $nin: req.user.following }
    })
      .select('name avatar role company bio pastInvestments')
      .limit(5);
    res.json(suggested);
  } catch (err) { next(err); }
});

// GET /api/auth/users/:id - Get user profile
router.get('/users/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar role bio company location website linkedIn twitter followers following connectionRequests pastInvestments investmentFocus investmentRange likes')
      .populate('followers', 'name avatar role')
      .populate('following', 'name avatar role');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// Connection / Follow Request Routes

// POST /api/auth/users/:id/like - Like a user profile
router.post('/users/:id/like', auth, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot like your own profile' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const isLiked = targetUser.likes.includes(req.user._id);
    if (isLiked) {
      targetUser.likes.pull(req.user._id);
    } else {
      targetUser.likes.push(req.user._id);
      
      // Notify target user
      const io = req.app.get('io');
      await createNotification({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'like',
        title: 'New Profile Like',
        body: `${req.user.name} liked your profile`,
        link: `/profile/${req.user._id}`,
        io,
      });
    }

    await targetUser.save({ validateBeforeSave: false });
    res.json({ liked: !isLiked, count: targetUser.likes.length });
  } catch (err) { next(err); }
});

// POST /api/auth/connect/:id - Send request
router.post('/connect/:id', auth, checkLimit('connections'), async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) return res.status(400).json({ error: 'Cannot connect to self' });

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Check if already following
    const isAlreadyFollowing = targetUser.followers.some(f => f.toString() === req.user._id.toString());
    if (isAlreadyFollowing) {
      return res.status(400).json({ error: 'You are already connected with this user' });
    }

    // Check if request already exists
    const existing = targetUser.connectionRequests.find(r => 
      r.from && r.from.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (existing) return res.status(400).json({ error: 'A connection request is already pending' });

    // Check if there is a pending request FROM the target user to the current user
    // If so, we should probably just accept it instead of sending a new one, 
    // but the user asked for a "request back" flow, so we'll allow it.
    
    targetUser.connectionRequests.push({ from: req.user._id });
    await targetUser.save({ validateBeforeSave: false });

    // Notify target user
    const io = req.app.get('io');
    await createNotification({
      recipient: targetId,
      sender: req.user._id,
      type: 'follow',
      title: 'New Connection Request',
      body: `${req.user.name} wants to connect with you`,
      link: '/notifications',
      io,
    });

    res.json({ message: 'Request sent' });
  } catch (err) { next(err); }
});

// GET /api/auth/requests - Get pending requests
router.get('/requests', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('connectionRequests.from', 'name avatar role company');
    const pending = user.connectionRequests.filter(r => r.status === 'pending');
    res.json(pending);
  } catch (err) { next(err); }
});

// POST /api/auth/requests/:requestId/accept
router.post('/requests/:requestId/accept', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.connectionRequests.id(req.params.requestId);
    if (!request || request.status !== 'pending') return res.status(404).json({ error: 'Request not found' });

    request.status = 'accepted';
    
    // ONE-WAY CONNECTION
    // User A (from) is following User B (me).
    // So User B (me) adds User A (from) to followers.
    if (!user.followers.includes(request.from)) user.followers.push(request.from);
    
    const fromUser = await User.findById(request.from);
    if (fromUser) {
      // User A (from) adds User B (me) to following.
      if (!fromUser.following.includes(user._id)) fromUser.following.push(user._id);
      await fromUser.save({ validateBeforeSave: false });
    }

    await user.save({ validateBeforeSave: false });

    // Notify requester
    const io = req.app.get('io');
    await createNotification({
      recipient: request.from,
      sender: user._id,
      type: 'follow',
      title: 'Request Accepted',
      body: `${user.name} accepted your connection request`,
      link: `/profile/${user._id}`,
      io,
    });

    res.json({ message: 'Request accepted' });
  } catch (err) { next(err); }
});

// POST /api/auth/requests/:requestId/decline
router.post('/requests/:requestId/decline', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.connectionRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    request.status = 'declined';
    await user.save({ validateBeforeSave: false });
    res.json({ message: 'Request declined' });
  } catch (err) { next(err); }
});

// DELETE /api/auth/followers/:id - Remove a follower
router.delete('/followers/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const followerId = req.params.id;

    // Remove follower from my followers
    user.followers = user.followers.filter(f => f.toString() !== followerId);
    user.connectionRequests = user.connectionRequests.filter(r => r.from && r.from.toString() !== followerId);
    await user.save({ validateBeforeSave: false });

    // Remove me from their following
    const followerUser = await User.findById(followerId);
    if (followerUser) {
      followerUser.following = followerUser.following.filter(f => f.toString() !== req.user._id.toString());
      followerUser.connectionRequests = followerUser.connectionRequests.filter(r => r.from && r.from.toString() !== req.user._id.toString());
      await followerUser.save({ validateBeforeSave: false });
    }

    const io = req.app.get('io');
    if (io && io.sendToUser) {
      io.sendToUser(followerId, 'connection_updated', { userId: req.user._id });
    }

    res.json({ message: 'Follower removed' });
  } catch (err) { next(err); }
});

// DELETE /api/auth/following/:id - Unfollow a user
router.delete('/following/:id', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const targetId = req.params.id;

    // Remove from my following
    user.following = user.following.filter(f => f.toString() !== targetId);
    user.connectionRequests = user.connectionRequests.filter(r => r.from && r.from.toString() !== targetId);
    await user.save({ validateBeforeSave: false });

    // Remove me from their followers
    const targetUser = await User.findById(targetId);
    if (targetUser) {
      targetUser.followers = targetUser.followers.filter(f => f.toString() !== req.user._id.toString());
      targetUser.connectionRequests = targetUser.connectionRequests.filter(r => r.from && r.from.toString() !== req.user._id.toString());
      await targetUser.save({ validateBeforeSave: false });
    }

    const io = req.app.get('io');
    if (io && io.sendToUser) {
      io.sendToUser(targetId, 'connection_updated', { userId: req.user._id });
    }

    res.json({ message: 'Unfollowed user' });
  } catch (err) { next(err); }
});

// GET /api/auth/dev-codes (disabled)
router.get('/dev-codes', auth, async (req, res, next) => {
  res.status(403).json({ error: 'Development codes are disabled for security.' });
});

module.exports = router;
