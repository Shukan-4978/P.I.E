const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');
const { Message } = require('../models/Message');
const { createNotification } = require('../services/notificationService');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const PLANS = {
  plus: { name: 'Plus', priceInr: 51, yearlyPriceInr: 490 },
  pro: { name: 'Pro', priceInr: 101, yearlyPriceInr: 969 },
  premium: { name: 'Premium', priceInr: 251, yearlyPriceInr: 2409 },
};

// POST /api/payments/create-order (For Plans)
router.post('/create-order', auth, async (req, res, next) => {
  try {
    const { plan, yearly } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan.' });
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway is not configured on this server.' });

    const baseAmount = yearly ? PLANS[plan].yearlyPriceInr : PLANS[plan].priceInr;
    const commission = baseAmount * 0.02;
    const totalAmount = baseAmount + commission;

    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `pl_${plan}_${req.user._id.toString().slice(-6)}_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: req.user._id.toString(),
        plan: plan,
        type: 'subscription_upgrade',
        baseAmount: baseAmount,
        commission: commission,
        yearly: yearly ? 'true' : 'false'
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('RAZORPAY ERROR:', err);
    next(err);
  }
});

// POST /api/payments/verify-payment
router.post('/verify-payment', auth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, yearly, messageId, installmentId } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Payment gateway is not configured on this server.' });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // If it's a subscription upgrade
    if (plan && PLANS[plan]) {
      const expiryDate = new Date();
      if (yearly) {
        expiryDate.setDate(expiryDate.getDate() + 365); // 365 days access
      } else {
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days access
      }

      await User.findByIdAndUpdate(req.user._id, {
        subscriptionStatus: 'active',
        subscriptionPlan: plan,
      });

      await Subscription.findOneAndUpdate(
        { user: req.user._id },
        {
          razorpayOrderId: razorpay_order_id,
          plan,
          billingCycle: yearly ? 'yearly' : 'monthly',
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: expiryDate,
          $push: {
            billingHistory: {
              invoiceId: razorpay_payment_id,
              amount: yearly ? PLANS[plan].yearlyPriceInr : PLANS[plan].priceInr,
              currency: 'INR',
              status: 'paid',
              paidAt: new Date(),
              billingCycle: yearly ? 'yearly' : 'monthly',
            },
          },
        },
        { upsert: true, new: true }
      );
      
      // Record transaction
      await Transaction.create({
        type: 'subscription',
        amount: yearly ? PLANS[plan].yearlyPriceInr : PLANS[plan].priceInr,
        user: req.user._id,
        razorpay_payment_id,
        razorpay_order_id,
        metadata: { plan, commission: (yearly ? PLANS[plan].yearlyPriceInr : PLANS[plan].priceInr) * 0.02, yearly }
      });

      return res.json({ success: true, message: 'Subscription upgraded successfully' });
    }

    // If it's an investment payment
    if (messageId) {
      const message = await Message.findById(messageId).populate('conversation');
      if (!message) return res.status(404).json({ error: 'Order reference message not found' });

      let paidAmount = message.offerData.amount;

      if (installmentId && message.offerData.isInstallmentPlan) {
        const installment = message.offerData.installments.id(installmentId);
        if (!installment) return res.status(404).json({ error: 'Installment not found' });
        
        installment.status = 'paid';
        installment.razorpayPaymentId = razorpay_payment_id;
        installment.paidAt = new Date();
        paidAmount = installment.amount;

        const allPaid = message.offerData.installments.every(inst => inst.status === 'paid');
        message.offerData.paymentStatus = allPaid ? 'sent' : 'partially_paid';
      } else {
        message.offerData.paymentStatus = 'sent';
        message.offerData.razorpayPaymentId = razorpay_payment_id;
      }

      await message.save();

      // Add to investor's past investments if not already there or update
      const investor = await User.findById(req.user._id);
      if (investor) {
        const existingInv = investor.pastInvestments.find(inv => 
          inv.companyName === message.offerData.startupName && 
          Math.abs(Number(inv.amount) - message.offerData.amount) < 1 // Simple check
        );

        if (!existingInv) {
          investor.pastInvestments.push({
            companyName: message.offerData.startupName || 'Startup',
            amount: message.offerData.amount.toString(),
            year: new Date().getFullYear().toString(),
            status: 'accepted',
            round: message.offerData.instrument || 'Seed',
            createdAt: new Date()
          });
          await investor.save({ validateBeforeSave: false });
        }
      }

      // Notify the founder
      const io = req.app.get('io');
      const founderId = message.conversation.participants.find(
        p => p.toString() !== req.user._id.toString()
      );

      await createNotification({
        recipient: founderId,
        sender: req.user._id,
        type: 'investment_offer',
        title: installmentId ? '💸 Installment Payment Received!' : '💸 Investment Payment Received!',
        body: `${req.user.name} has sent ₹${Number(paidAmount).toLocaleString('en-IN')} via Razorpay.`,
        entityId: message.conversation._id,
        entityModel: 'Conversation',
        link: `/messages/${message.conversation._id}`,
        io,
      });

      if (io) {
        io.to(`conversation:${message.conversation._id}`).emit('offer_payment_update', {
          messageId: message._id,
          paymentStatus: message.offerData.paymentStatus,
          installmentId: installmentId || null
        });
      }

      // Record transaction (Platform Fee / Commission)
      const commissionAmount = Number(paidAmount) * 0.02;
      await Transaction.create({
        type: 'investment_commission',
        amount: commissionAmount,
        user: req.user._id, // The one who paid (Investor)
        investor: req.user._id,
        founder: founderId,
        startup: message.offerData.startupId,
        razorpay_payment_id,
        razorpay_order_id,
        metadata: { 
          baseAmount: paidAmount,
          messageId,
          installmentId: installmentId || 'full'
        }
      });

      return res.json({ success: true, message: 'Investment payment processed successfully' });
    }

    res.status(400).json({ error: 'No valid plan or messageId provided for fulfillment' });
  } catch (err) {
    console.error('VERIFY PAYMENT ERROR:', err);
    next(err);
  }
});

// GET /api/payments/subscription
router.get('/subscription', auth, async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });
    res.json(subscription || { plan: 'free', status: 'inactive' });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/send-investment-order
router.post('/send-investment-order', auth, async (req, res, next) => {
  try {
    const { messageId, installmentId } = req.body;
    if (!razorpay) return res.status(500).json({ error: 'Payment gateway is not configured on this server.' });
    
    const message = await Message.findById(messageId);
    if (!message || message.type !== 'offer') return res.status(404).json({ error: 'Offer not found' });

    let amountToSend = message.offerData.amount;
    if (installmentId && message.offerData.isInstallmentPlan) {
      const installment = message.offerData.installments.id(installmentId);
      if (!installment) return res.status(404).json({ error: 'Installment not found' });
      amountToSend = installment.amount;
    }

    const amountToCharge = Number(amountToSend);
    if (isNaN(amountToCharge) || amountToCharge <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const commission = amountToCharge * 0.02;
    const totalAmount = amountToCharge + commission;
    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: installmentId ? `inst_${installmentId}` : `inv_${messageId}`,
      notes: {
        messageId: messageId,
        installmentId: installmentId || '',
        investorId: req.user._id.toString(),
        startupName: message.offerData.startupName || '',
        baseAmount: amountToSend,
        commission: commission
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('INVESTMENT ORDER ERROR:', {
      error: err.message,
      stack: err.stack,
      body: req.body
    });
    next(err);
  }
});

module.exports = router;
