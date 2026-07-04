const express = require('express');
const router = express.Router();
const { Conversation, Message } = require('../models/Message');
const { auth } = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { checkLimit } = require('../middleware/limitMiddleware');

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar role lastSeen isVerified')
      .populate('lastMessage.sender', 'name isVerified')
      .sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/conversations — start or get existing conversation
router.post('/conversations', auth, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { PLAN_LIMITS } = require('../middleware/limitMiddleware');
    const { participantId } = req.body;
    if (!participantId) return res.status(400).json({ error: 'participantId required.' });
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot message yourself.' });
    }

    // Block free plan users from messaging
    const currentUser = await User.findById(req.user._id);
    const plan = currentUser.subscriptionPlan || 'free';
    /* Temporarily disabled
    if (plan === 'free') {
      return res.status(403).json({
        error: 'Messaging is available from the PIE Plus plan and above. Upgrade to start chatting!',
        limitReached: true,
        requiredPlan: 'plus',
        type: 'messages'
      });
    }
    */

    const targetUser = await User.findById(participantId);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    const isFollowing = currentUser.following.includes(participantId);
    const isFollowedBy = currentUser.followers.includes(participantId);

    if (!isFollowing || !isFollowedBy) {
      return res.status(403).json({ 
        error: 'You can only message users you are mutually connected with.',
        needsConnection: true 
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
    }).populate('participants', 'name avatar role lastSeen isVerified');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
        unreadCounts: { [req.user._id]: 0, [participantId]: 0 },
      });
      await conversation.populate('participants', 'name avatar role lastSeen isVerified');
    }

    res.json(conversation);
  } catch (err) {
    next(err);
  }
});

// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', auth, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar isVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user._id }, read: false },
      { read: true, readAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCounts.set(req.user._id.toString(), 0);
    await conversation.save();

    res.json(messages.reverse());
  } catch (err) {
    next(err);
  }
});

const { uploadChatFile } = require('../middleware/upload');

// POST /api/messages/upload — upload file for chat
router.post('/upload', auth, uploadChatFile.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const url = req.file.path;
    res.json({ 
      url, 
      name: req.file.originalname, 
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/conversations/:id/messages — send message (updated with attachments)
router.post('/conversations/:id/messages', auth, checkLimit('messages'), async (req, res, next) => {
  try {
    const { content, type = 'text', offerData, attachments } = req.body;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    // Sanitize offerData: remove empty startupId to prevent ObjectId cast error
    let sanitizedOfferData = undefined;
    if (offerData) {
      sanitizedOfferData = { ...offerData };
      if (!sanitizedOfferData.startupId || sanitizedOfferData.startupId === '') {
        delete sanitizedOfferData.startupId;
      }
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content,
      type,
      offerData: sanitizedOfferData,
      attachments: attachments || []
    });

    await message.populate('sender', 'name avatar');

    // Update conversation last message
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    conversation.lastMessage = {
      content: type === 'image' ? 'Sent an image' : (type === 'file' ? 'Sent a file' : (type === 'offer' ? 'Investment Offer' : content)),
      sender: req.user._id,
      createdAt: new Date(),
    };
    const currentCount = conversation.unreadCounts.get(otherParticipant.toString()) || 0;
    conversation.unreadCounts.set(otherParticipant.toString(), currentCount + 1);
    await conversation.save();

    // Real-time emit
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('new_message', message);
    }

    // Notification — use special type for investment offers
    const isOffer = type === 'offer';
    await createNotification({
      recipient: otherParticipant,
      sender: req.user._id,
      type: isOffer ? 'investment_offer' : 'message',
      title: isOffer
        ? `💰 Investment Offer Received`
        : 'New Message',
      body: isOffer
        ? `${req.user.name} sent you an investment offer of ₹${Number(sanitizedOfferData?.amount || 0).toLocaleString('en-IN')} for ${sanitizedOfferData?.equity}% equity.`
        : `${req.user.name}: ${content.substring(0, 50)}`,
      entityId: conversation._id,
      entityModel: 'Conversation',
      link: `/messages/${conversation._id}`,
      io,
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

// PUT /api/messages/offers/:msgId/status — accept/decline offer
router.put('/offers/:msgId/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const message = await Message.findById(req.params.msgId).populate('conversation');
    if (!message || message.type !== 'offer') return res.status(404).json({ error: 'Offer not found' });

    // Ensure user is the recipient (participant who didn't send the offer)
    const isRecipient = message.conversation.participants.some(p => p.toString() === req.user._id.toString()) && 
                        message.sender.toString() !== req.user._id.toString();
    
    if (!isRecipient) return res.status(403).json({ error: 'Unauthorized' });

    message.offerData.status = status;
    await message.save();

    // Real-time emit
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversation._id}`).emit('offer_status_update', { 
        messageId: message._id, 
        status 
      });
    }

    // Notify the investor (offer sender) about the decision
    const statusEmoji = status === 'accepted' ? '✅' : '❌';
    const amountStr = message.offerData?.amount
      ? `₹${Number(message.offerData.amount).toLocaleString('en-IN')}`
      : 'your';
    await createNotification({
      recipient: message.sender,
      sender: req.user._id,
      type: 'investment_offer',
      title: `${statusEmoji} Offer ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      body: `${req.user.name} has ${status} your investment offer of ${amountStr} for ${message.offerData?.equity}% equity.`,
      entityId: message.conversation._id,
      entityModel: 'Conversation',
      link: `/messages/${message.conversation._id}`,
      io,
    });

    res.json({ message: 'Status updated', status });
  } catch (err) {
    next(err);
  }
});
// DELETE /api/messages/conversations/:id/messages — bulk delete messages
router.delete('/conversations/:id/messages', auth, async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds array is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    // Only allow users to delete their own messages
    await Message.deleteMany({
      _id: { $in: messageIds },
      conversation: req.params.id,
      sender: req.user._id
    });

    // Real-time emit to tell both clients to remove these messages from UI
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('messages_deleted', { messageIds });
    }

    res.json({ message: 'Messages deleted successfully', deletedIds: messageIds });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages/conversations/:id/messages/delete — bulk delete messages (safer than DELETE body payload)
router.post('/conversations/:id/messages/delete', auth, async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds array is required' });
    }

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    // Only allow users to delete their own messages
    await Message.deleteMany({
      _id: { $in: messageIds },
      conversation: req.params.id,
      sender: req.user._id
    });

    // Real-time emit to tell both clients to remove these messages from UI
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('messages_deleted', { messageIds });
    }

    res.json({ message: 'Messages deleted successfully', deletedIds: messageIds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
