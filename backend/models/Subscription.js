const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    razorpayOrderId: { type: String, default: '' },
    razorpaySubscriptionId: { type: String, default: '' },
    plan: { type: String, enum: ['free', 'plus', 'pro', 'premium'], default: 'free' },
    status: {
      type: String,
      enum: ['inactive', 'active', 'cancelled', 'past_due', 'trialing'],
      default: 'inactive',
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    billingHistory: [
      {
        invoiceId: String,
        amount: Number,
        currency: String,
        status: String,
        paidAt: Date,
        hostedUrl: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
