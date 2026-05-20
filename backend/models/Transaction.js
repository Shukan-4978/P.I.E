const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['subscription', 'investment_commission'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For investment commission
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  founder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  razorpay_payment_id: String,
  razorpay_order_id: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
