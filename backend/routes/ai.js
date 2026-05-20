const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const AIAnalysis = require('../models/AIAnalysis');
const Startup = require('../models/Startup');
const { auth, requireRole } = require('../middleware/auth');
const { uploadPitchDeck } = require('../middleware/upload');
const { analyzeWithOpenAI, generateChatbotResponse } = require('../services/aiService');
const { createNotification } = require('../services/notificationService');
const AIChatMessage = require('../models/AIChatMessage');
const { checkLimit } = require('../middleware/limitMiddleware');

// POST /api/ai/analyze — upload and queue analysis
router.post('/analyze', auth, checkLimit('ai_analysis'), uploadPitchDeck.single('pitchDeck'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Pitch deck file is required.' });

    const { startupId } = req.body;
    const pitchDeckUrl = `/uploads/pitchdecks/${req.file.filename}`;

    const analysis = await AIAnalysis.create({
      startup: startupId || undefined,
      uploadedBy: req.user._id,
      pitchDeckUrl,
      originalFileName: req.file.originalname,
      status: 'queued',
    });

    if (startupId) {
      await Startup.findByIdAndUpdate(startupId, { pitchDeckUrl });
    }

    runAnalysisAsync(analysis._id, req.file.path, req.user._id, req.app.get('io'));

    res.status(202).json({
      message: 'Pitch deck uploaded. Analysis is processing asynchronously.',
      analysisId: analysis._id,
      status: 'queued',
    });
  } catch (err) {
    next(err);
  }
});

async function runAnalysisAsync(analysisId, filePath, userId, io) {
  const AIAnalysis = require('../models/AIAnalysis');
  try {
    await AIAnalysis.findByIdAndUpdate(analysisId, { status: 'processing' });
    const result = await analyzeWithOpenAI(filePath);
    await AIAnalysis.findByIdAndUpdate(analysisId, {
      status: 'completed',
      processedAt: new Date(),
      ...result,
    });
    await createNotification({
      recipient: userId,
      sender: null,
      type: 'analysis_ready',
      title: '🧠 AI Analysis Complete!',
      body: `Your pitch deck analysis is ready. Score: ${result.investmentScore}/100`,
      entityId: analysisId,
      entityModel: 'AIAnalysis',
      link: `/ai-analysis/${analysisId}`,
      io,
    });
  } catch (err) {
    console.error('AI Analysis failed:', err.message);
    await AIAnalysis.findByIdAndUpdate(analysisId, { status: 'failed', errorMessage: err.message });
  }
}

router.get('/analyses', auth, async (req, res, next) => {
  try {
    const analyses = await AIAnalysis.find({ uploadedBy: req.user._id })
      .populate('startup', 'title industry')
      .sort({ createdAt: -1 });
    res.json(analyses);
  } catch (err) { next(err); }
});

router.get('/analyses/:id', auth, async (req, res, next) => {
  try {
    const analysis = await AIAnalysis.findOne({ _id: req.params.id, uploadedBy: req.user._id })
      .populate('startup', 'title industry stage');
    if (!analysis) return res.status(404).json({ error: 'Analysis not found.' });
    res.json(analysis);
  } catch (err) { next(err); }
});

router.get('/startup/:startupId', auth, async (req, res, next) => {
  try {
    const analysis = await AIAnalysis.findOne({ startup: req.params.startupId, status: 'completed' }).sort({ createdAt: -1 });
    if (!analysis) return res.status(404).json({ error: 'No completed analysis found.' });
    res.json(analysis);
  } catch (err) { next(err); }
});

router.get('/chat', auth, async (req, res, next) => {
  try {
    const history = await AIChatMessage.find({ user: req.user._id }).sort({ createdAt: 1 }).lean();
    res.json(history);
  } catch (err) { next(err); }
});

router.post('/chat', auth, checkLimit('ai_advisor'), async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });

    const recentHistory = await AIChatMessage.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
    const chatHistory = recentHistory.reverse();

    const userMessage = await AIChatMessage.create({ user: req.user._id, role: 'user', content: message });
    const aiResponseText = await generateChatbotResponse(req.user.role, req.user.name, message, chatHistory);
    const aiMessage = await AIChatMessage.create({ user: req.user._id, role: 'model', content: aiResponseText });

    res.json({ userMessage, aiMessage });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Failed to communicate with AI Advisor.' });
  }
});

// GET /api/ai/matches — AI-powered profile match scoring
// ─────────────────────────────────────────────────────────
router.get('/matches', auth, checkLimit('ai_match'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const me = await User.findById(req.user._id);
    const limit = parseInt(req.query.limit) || 6;
    let matches = [];

    if (me.role === 'founder') {
      const myStartup = await Startup.findOne({ founder: me._id, isApproved: true }).sort({ createdAt: -1 });
      const investors = await User.find({ role: 'investor', _id: { $ne: me._id }, isBlocked: false }).lean();

      matches = investors.map(inv => {
        let score = 0;
        const factors = [];

        // 1. Industry alignment (30 pts)
        const founderIndustries = [...(me.industries || []), ...(myStartup ? [myStartup.industry] : [])].map(i => i?.toLowerCase());
        const invFocus = (inv.investmentFocus || []).map(i => i?.toLowerCase());
        const industryOverlap = founderIndustries.filter(i => invFocus.some(f => f?.includes(i) || i?.includes(f)));
        if (industryOverlap.length > 0) {
          const pts = Math.min(30, industryOverlap.length * 15);
          score += pts;
          factors.push({ label: 'Industry Alignment', score: pts, max: 30, detail: `${industryOverlap.length} matching sector(s)` });
        } else {
          factors.push({ label: 'Industry Alignment', score: 0, max: 30, detail: 'No sector overlap yet' });
        }

        // 2. Investment range fit (25 pts)
        if (myStartup?.fundingGoal && inv.investmentRange?.max > 0) {
          const goal = myStartup.fundingGoal;
          const { min = 0, max = 0 } = inv.investmentRange;
          if (goal >= min && goal <= max) {
            score += 25;
            factors.push({ label: 'Funding Range Fit', score: 25, max: 25, detail: `₹${(goal / 100000).toFixed(1)}L within range` });
          } else if (goal >= min * 0.5 && goal <= max * 2) {
            score += 12;
            factors.push({ label: 'Funding Range Fit', score: 12, max: 25, detail: 'Partially within range' });
          } else {
            factors.push({ label: 'Funding Range Fit', score: 0, max: 25, detail: 'Outside investment range' });
          }
        } else {
          score += 10;
          factors.push({ label: 'Funding Range Fit', score: 10, max: 25, detail: 'Open to all investment sizes' });
        }

        // 3. Stage match (15 pts)
        const stageFocus = (inv.investmentFocus || []).map(s => s?.toLowerCase());
        const myStage = myStartup?.stage?.toLowerCase();
        const stageKeywords = ['idea', 'mvp', 'pre-seed', 'seed', 'series', 'growth'];
        const stageMatch = stageFocus.some(f => stageKeywords.some(k => f?.includes(k) && myStage?.includes(k.split('-')[0])));
        if (stageMatch || !stageFocus.length) {
          score += 15;
          factors.push({ label: 'Stage Alignment', score: 15, max: 15, detail: myStage ? `${myStartup.stage} stage match` : 'Open to all stages' });
        } else {
          factors.push({ label: 'Stage Alignment', score: 0, max: 15, detail: 'Stage mismatch' });
        }

        // 4. Past investment sector (10 pts)
        const pastSectors = (inv.pastInvestments || []).map(p => p.sector?.toLowerCase()).filter(Boolean);
        const sectorOverlap = founderIndustries.filter(i => pastSectors.some(s => s?.includes(i) || i?.includes(s)));
        if (sectorOverlap.length > 0) {
          const pts = Math.min(10, sectorOverlap.length * 5);
          score += pts;
          factors.push({ label: 'Track Record', score: pts, max: 10, detail: `Invested in ${sectorOverlap[0]} before` });
        } else {
          factors.push({ label: 'Track Record', score: 0, max: 10, detail: 'No prior sector investments' });
        }

        // 5. Startup traction (10 pts)
        const t = myStartup?.traction || {};
        const tractionPts = (t.revenue > 0 ? 4 : 0) + (t.users > 100 ? 3 : 0) + (t.growthRate > 10 ? 3 : 0);
        score += tractionPts;
        factors.push({ label: 'Startup Traction', score: tractionPts, max: 10, detail: tractionPts > 5 ? 'Strong traction signals' : 'Early stage' });

        // 6. Investor credibility (5 pts)
        const invFields = [inv.bio, inv.avatar, inv.linkedIn, inv.location, inv.investmentFocus?.length].filter(Boolean).length;
        const credPts = Math.round((invFields / 5) * 5);
        score += credPts;
        factors.push({ label: 'Investor Credibility', score: credPts, max: 5, detail: inv.isVerified ? '✓ Verified investor' : `${invFields}/5 profile complete` });

        // 7. Location (5 pts)
        if (me.location && inv.location && me.location.toLowerCase().split(',')[0].trim() === inv.location.toLowerCase().split(',')[0].trim()) {
          score += 5;
          factors.push({ label: 'Location Match', score: 5, max: 5, detail: 'Same city / region' });
        } else {
          factors.push({ label: 'Location Match', score: 0, max: 5, detail: inv.location || 'Remote' });
        }

        const matchScore = Math.min(100, Math.round(score));
        const tag = matchScore >= 80 ? 'Top Match' : matchScore >= 60 ? 'Strong Fit' : matchScore >= 40 ? 'Good Potential' : 'Explore';
        return { ...inv, matchScore, matchFactors: factors, matchReasons: factors.filter(f => f.score > 0).map(f => f.detail), matchTag: tag };
      });

    } else if (me.role === 'investor') {
      const startups = await Startup.find({ isApproved: true })
        .populate('founder', 'name avatar bio location industries company isVerified subscriptionPlan followers following connectionRequests')
        .sort({ createdAt: -1 }).lean();

      const founderMap = {};
      for (const s of startups) {
        if (!s.founder || s.founder._id?.toString() === me._id.toString()) continue;
        const fid = s.founder._id.toString();
        if (!founderMap[fid]) founderMap[fid] = { founder: s.founder, startups: [] };
        founderMap[fid].startups.push(s);
      }

      matches = Object.values(founderMap).map(({ founder, startups }) => {
        const startup = startups[0];
        let score = 0;
        const factors = [];

        // 1. Industry (30 pts)
        const myFocus = (me.investmentFocus || []).map(i => i?.toLowerCase());
        const startupInd = startup.industry?.toLowerCase();
        const industryMatch = myFocus.filter(f => f?.includes(startupInd) || startupInd?.includes(f));
        if (industryMatch.length > 0) {
          const pts = Math.min(30, industryMatch.length * 15);
          score += pts;
          factors.push({ label: 'Industry Alignment', score: pts, max: 30, detail: `${startup.industry} aligns with your focus` });
        } else {
          factors.push({ label: 'Industry Alignment', score: 0, max: 30, detail: 'Outside your focus sectors' });
        }

        // 2. Funding ask fit (25 pts)
        const goal = startup.fundingGoal || 0;
        const { min = 0, max = 0 } = me.investmentRange || {};
        if (goal > 0 && max > 0) {
          if (goal >= min && goal <= max) {
            score += 25;
            factors.push({ label: 'Funding Ask Fit', score: 25, max: 25, detail: `Asking ₹${(goal / 100000).toFixed(1)}L — within your range` });
          } else if (goal >= min * 0.5 && goal <= max * 2) {
            score += 12;
            factors.push({ label: 'Funding Ask Fit', score: 12, max: 25, detail: 'Slightly outside your range' });
          } else {
            factors.push({ label: 'Funding Ask Fit', score: 0, max: 25, detail: 'Outside your investment range' });
          }
        } else {
          score += 10;
          factors.push({ label: 'Funding Ask Fit', score: 10, max: 25, detail: 'Flexible requirement' });
        }

        // 3. Stage (15 pts)
        const stagePts = ['seed', 'pre-seed'].includes(startup.stage) ? 15 : ['series-a', 'mvp'].includes(startup.stage) ? 12 : 8;
        score += stagePts;
        factors.push({ label: 'Growth Stage', score: stagePts, max: 15, detail: `${startup.stage} — ${stagePts >= 12 ? 'ideal entry' : 'established'}` });

        // 4. Traction (15 pts)
        const t = startup.traction || {};
        let tp = 0;
        if (t.revenue > 500000) tp += 5; else if (t.revenue > 0) tp += 2;
        if (t.users > 1000) tp += 5; else if (t.users > 100) tp += 2;
        if (t.growthRate > 20) tp += 5; else if (t.growthRate > 5) tp += 2;
        score += tp;
        factors.push({ label: 'Business Traction', score: tp, max: 15, detail: t.revenue > 0 ? `₹${(t.revenue / 1000).toFixed(0)}K ARR` : t.users > 0 ? `${t.users.toLocaleString()} users` : 'Pre-revenue' });

        // 5. Team depth (5 pts)
        const teamPts = Math.min(5, (startup.teamMembers?.length || 0) * 2);
        score += teamPts;
        factors.push({ label: 'Team Depth', score: teamPts, max: 5, detail: `${startup.teamMembers?.length || 0} team member(s)` });

        // 6. Founder credibility (5 pts)
        const fields = [founder.bio, founder.avatar, startup.pitchDeckUrl, startup.website, startup.tagline].filter(Boolean).length;
        const profPts = Math.round((fields / 5) * 5);
        score += profPts;
        factors.push({ label: 'Founder Credibility', score: profPts, max: 5, detail: founder.isVerified ? '✓ Verified founder' : `${fields}/5 profile filled` });

        // 7. Location (5 pts)
        if (me.location && startup.location && me.location.toLowerCase().split(',')[0].trim() === startup.location.toLowerCase().split(',')[0].trim()) {
          score += 5;
          factors.push({ label: 'Location Match', score: 5, max: 5, detail: 'Same city / region' });
        } else {
          factors.push({ label: 'Location Match', score: 0, max: 5, detail: startup.location || 'Remote' });
        }

        const matchScore = Math.min(100, Math.round(score));
        const tag = matchScore >= 80 ? 'Top Match' : matchScore >= 60 ? 'Strong Fit' : matchScore >= 40 ? 'Good Potential' : 'Explore';
        return { ...founder, startup, matchScore, matchFactors: factors, matchReasons: factors.filter(f => f.score > 0).map(f => f.detail), matchTag: tag };
      });
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    res.json(matches.slice(0, limit));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
