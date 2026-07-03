require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pie-platform';
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Find all users with active paid subscriptions
    const activeSubs = await Subscription.find({ status: 'active' }).select('user');
    const activeUserIds = activeSubs.map(s => s.user.toString());
    console.log(`Found ${activeUserIds.length} users with active paid subscriptions in the database.`);

    // Reset subscriptionPlan and subscriptionStatus for all other users
    const result = await User.updateMany(
      { _id: { $nin: activeUserIds } },
      {
        $set: {
          subscriptionPlan: 'free',
          subscriptionStatus: 'inactive'
        }
      }
    );

    console.log(`Successfully reset ${result.modifiedCount} non-subscribed users to 'free' plan and 'inactive' status.`);

    // Log the updated list of users to confirm
    const users = await User.find({}, 'name email role subscriptionPlan subscriptionStatus');
    console.log("Current user subscriptions in database:");
    console.log(users);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

run();
