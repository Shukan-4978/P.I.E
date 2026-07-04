const mongoose = require('mongoose');

const uri = process.argv[2];
const email = process.argv[3];

if (!uri || !email) {
  console.log('Usage: node make_admin.js "<YOUR_MONGODB_ATLAS_URI>" "<USER_EMAIL>"');
  process.exit(1);
}

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB Atlas...');
    
    // We just need to access the users collection
    const db = mongoose.connection.db;
    const result = await db.collection('users').updateOne(
      { email: email.toLowerCase() },
      { $set: { role: 'admin' } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Success! Upgraded ${email} to admin.`);
    } else if (result.matchedCount > 0) {
      console.log(`⚠️ User ${email} is already an admin.`);
    } else {
      console.log(`❌ Could not find a user with email ${email}.`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  });
