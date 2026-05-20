const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema(
  {
    founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    tagline: { type: String, maxlength: 200, default: '' },
    description: { type: String, required: true, maxlength: 2000 },
    problem: { type: String, maxlength: 1000, default: '' },
    solution: { type: String, maxlength: 1000, default: '' },
    industry: {
      type: String,
      enum: ['fintech', 'healthtech', 'edtech', 'saas', 'ecommerce', 'ai-ml', 'cleantech', 'logistics', 'real-estate', 'other'],
      required: true,
    },
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth'],
      required: true,
    },
    location: { type: String, default: '' },
    fundingGoal: { type: Number, default: 0 },
    valuation: { type: Number, default: 0 },
    equity: { type: Number, default: 0 }, // percentage
    raisedSoFar: { type: Number, default: 0 },
    teamMembers: [
      {
        name: String,
        role: String,
        linkedIn: String,
        avatar: String,
      },
    ],
    traction: {
      revenue: { type: Number, default: 0 },
      users: { type: Number, default: 0 },
      growthRate: { type: Number, default: 0 },
      partnerships: { type: Number, default: 0 },
    },
    pitchDeckUrl: { type: String, default: '' },
    images: [{ type: String }],
    logo: { type: String, default: '' },
    website: { type: String, default: '' },
    tags: [{ type: String }],
    // Moderation
    verificationDocument: { type: String, default: '' },
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    // Engagement
    views: { type: Number, default: 0 },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    investmentOffers: [
      {
        investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        message: String,
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

startupSchema.index({ founder: 1 });
startupSchema.index({ industry: 1, stage: 1 });
startupSchema.index({ isApproved: 1, createdAt: -1 });
startupSchema.index({ title: 'text', description: 'text', tagline: 'text' });

module.exports = mongoose.model('Startup', startupSchema);
