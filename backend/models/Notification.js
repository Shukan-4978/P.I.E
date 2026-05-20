const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'like',
        'comment',
        'message',
        'investment_offer',
        'follow',
        'startup_approved',
        'startup_rejected',
        'analysis_ready',
        'subscription',
      ],
      required: true,
    },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityModel: { type: String, enum: ['Post', 'Startup', 'Conversation', 'AIAnalysis', 'User'] },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
