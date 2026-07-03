require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pie-platform';
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const result = await User.updateMany(
      {},
      {
        $set: {
          subscriptionPlan: 'premium',
          subscriptionStatus: 'active',
          isEmailVerified: true,
          isPhoneVerified: true,
          isVerified: true
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} users to Premium and verified status.`);
    
    // Print all users now
    const users = await User.find({}, 'name email role subscriptionPlan isVerified');
    console.log("Current users list:");
    console.log(users);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (err) {
    console.error("Error upgrading users:", err);
  }
}

run();
