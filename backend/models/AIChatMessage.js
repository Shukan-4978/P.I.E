const mongoose = require('mongoose');

const aiChatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'model'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }
);

// TTL index to automatically delete messages after 10 days (864000 seconds = 10 days)
aiChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 864000 });
// Index to quickly fetch a user's chat history
aiChatMessageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('AIChatMessage', aiChatMessageSchema);
