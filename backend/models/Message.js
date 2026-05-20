const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
      content: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date },
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    type: { type: String, enum: ['text', 'image', 'file', 'offer'], default: 'text' },
    attachments: [{
      url: String,
      name: String,
      mimeType: String,
      size: Number
    }],
    // Investment offer payload
    offerData: {
      amount: Number,
      equity: Number,
      status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
      paymentStatus: { type: String, enum: ['not_sent', 'sent', 'confirmed', 'partially_paid'], default: 'not_sent' },
      paymentIntentId: String,
      startupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
      startupName: String,
      isInstallmentPlan: { type: Boolean, default: false },
      installments: [{
        amount: Number,
        dueDate: Date,
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        razorpayPaymentId: String,
        paidAt: Date
      }]
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Conversation, Message };
