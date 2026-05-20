const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['User', 'Startup', 'Post'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'misinformation', 'inappropriate', 'fraud', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolution: { type: String, default: '' },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });

module.exports = mongoose.model('Report', reportSchema);
