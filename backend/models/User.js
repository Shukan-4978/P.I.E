const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['founder', 'investor', 'admin'], required: true },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedIn: { type: String, default: '' },
    twitter: { type: String, default: '' },
    phone: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: '' },
    isPhoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: { type: String, default: '' },
    // Investor-specific
    investmentFocus: [{ type: String }],
    investmentRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    pastInvestments: [{
      companyName: { type: String, trim: true },
      year: { type: String },
      amount: { type: String },
      sector: { type: String },
      round: { type: String, default: 'Seed' },
      website: { type: String },
      location: { type: String, default: '' },
      proof: { type: String, default: '' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      rejectionReason: { type: String, default: '' },
      exitStatus: { type: String, enum: ['Active', 'Acquired', 'IPO', 'Closed'], default: 'Active' },
      createdAt: { type: Date, default: Date.now }
    }],
    // Founder-specific
    company: { type: String, default: '' },
    // Subscription
    stripeCustomerId: { type: String, default: '' },
    subscriptionStatus: {
      type: String,
      enum: ['inactive', 'active', 'cancelled', 'past_due'],
      default: 'inactive',
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'plus', 'pro', 'premium'],
      default: 'free',
    },
    subscriptionId: { type: String, default: '' },
    // Status
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Instagram-style connection requests
    connectionRequests: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    industries: [{ type: String }],
    notificationSettings: {
      all: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      offers: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      activity: { type: Boolean, default: true },
      aiReports: { type: Boolean, default: true }
    },
    usageStats: {
      messagesToday: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      connectionsMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      postsMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      startupsMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      investmentsMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      aiAnalysisMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
      aiAdvisorMessagesMonth: { 
        count: { type: Number, default: 0 }, 
        lastReset: { type: Date, default: Date.now } 
      },
    },
    agreedToTerms: { type: Boolean, default: false },
    agreedAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ role: 1 });
userSchema.index({ name: 'text', bio: 'text' });

module.exports = mongoose.model('User', userSchema);
