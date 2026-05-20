const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Post = require('./backend/models/Post');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pie-platform');
  const count = await Post.countDocuments();
  console.log(`Total posts: ${count}`);
  const posts = await Post.find().limit(5);
  console.log('Sample posts:', JSON.stringify(posts, null, 2));
  process.exit();
}

check();
