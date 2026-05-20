require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pie-platform');
    console.log('MongoDB Connected');

    const adminEmail = 'admin@pie.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists!');
    } else {
      admin = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: 'password123',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true
      });
      console.log('Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', 'password123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
