const mongoose = require('mongoose');
require('dotenv').config();
const Post = require('./models/Post');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pie-platform');
    const count = await Post.countDocuments();
    console.log(`Total posts: ${count}`);
    const posts = await Post.find().limit(5).populate('author', 'name');
    console.log('Sample posts:', JSON.stringify(posts, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
