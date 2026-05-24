const User = require('../models/User');

const PLAN_LIMITS = {
  free: {
    connections: 5,
    messages: 0,
    posts: 2,
    startups: 1,
    investments: 1,
    ai_analysis: 0,
    ai_advisor: 0,
    ai_match: false
  },
  plus: {
    connections: 10,
    messages: 10,
    posts: 5,
    startups: 2,
    investments: 2,
    ai_analysis: 5,
    ai_advisor: 0,
    ai_match: false
  },
  pro: {
    connections: 20,
    messages: 50,
    posts: 10,
    startups: 5,
    investments: 5,
    ai_analysis: 10,
    ai_advisor: 10,
    ai_match: true
  },
  premium: {
    connections: Infinity,
    messages: Infinity,
    posts: Infinity,
    startups: Infinity,
    investments: Infinity,
    ai_analysis: Infinity,
    ai_advisor: Infinity,
    ai_match: true
  }
};

const checkLimit = (type) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      const plan = user.subscriptionPlan || 'free';
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['free'];

      if (type === 'ai_match') {
        if (!limits.ai_match) {
          return res.status(403).json({ 
            error: 'AI Match is only available in Pro and Premium plans.',
            limitReached: true,
            requiredPlan: 'pro'
          });
        }
        return next();
      }

      // Initialize usageStats if missing entirely
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
      }

      const stats = user.usageStats;
      const now = new Date();

      // Mapping type to DB field
      const isDaily = type === 'messages';
      let dbField = '';
      if (isDaily) {
        dbField = 'messagesToday';
      } else {
        const mapping = {
          connections: 'connectionsMonth',
          posts: 'postsMonth',
          startups: 'startupsMonth',
          investments: 'investmentsMonth',
          ai_analysis: 'aiAnalysisMonth',
          ai_advisor: 'aiAdvisorMessagesMonth'
        };
        dbField = mapping[type];
      }

      // Ensure the specific sub-field exists
      if (!stats[dbField]) {
        stats[dbField] = { count: 0, lastReset: now };
      }

      const lastReset = stats[dbField].lastReset;
      let needsReset = false;
      if (isDaily) {
        needsReset = now.toDateString() !== new Date(lastReset).toDateString();
      } else {
        const lrDate = new Date(lastReset);
        needsReset = now.getMonth() !== lrDate.getMonth() || now.getFullYear() !== lrDate.getFullYear();
      }

      if (needsReset) {
        stats[dbField].count = 0;
        stats[dbField].lastReset = now;
      }

      const currentCount = stats[dbField].count;
      const maxLimit = limits[type];

      // Block if limit reached
      if (currentCount >= maxLimit) {
        const period = isDaily ? 'today' : 'this month';
        const displayType = type.replace('_', ' ');
        return res.status(403).json({ 
          error: `Quota reached: Your ${plan} plan allows ${maxLimit} ${displayType} ${period}. You have already used ${currentCount}.`,
          limitReached: true,
          type,
          plan,
          limit: maxLimit
        });
      }

      // Increment and Save
      stats[dbField].count += 1;
      
      // Mark as modified for nested object updates in Mongoose
      user.markModified('usageStats');
      await user.save({ validateBeforeSave: false });
      
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkLimit, PLAN_LIMITS };
