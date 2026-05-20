const mongoose = require('mongoose');
const User = require('../models/User');
const { PLAN_LIMITS } = require('../middleware/limitMiddleware');

async function verifyLimits() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pie-platform');
    console.log('Connected to MongoDB');

    const email = 'rik6083@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Current Plan: ${user.subscriptionPlan}`);
    const plan = user.subscriptionPlan || 'free';
    const limits = PLAN_LIMITS[plan];
    
    console.log('Plan Limits:', JSON.stringify(limits, null, 2));

    // Reset some stats for testing
    user.usageStats.postsMonth.count = limits.posts - 1;
    await user.save({ validateBeforeSave: false });
    console.log(`Set posts count to ${user.usageStats.postsMonth.count} (Limit: ${limits.posts}).`);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

verifyLimits();
