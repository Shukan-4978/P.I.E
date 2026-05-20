const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pitchDeckUrl: { type: String, required: true },
    originalFileName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    // AI-generated fields
    summary: { type: String, default: '' },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    riskFactors: [{ type: String }],
    opportunities: [{ type: String }],
    // Scores (0-100)
    investmentScore: { type: Number, default: 0 },
    marketScore: { type: Number, default: 0 },
    problemClarity: { type: Number, default: 0 },
    solutionStrength: { type: Number, default: 0 },
    teamQuality: { type: Number, default: 0 },
    revenueModelScore: { type: Number, default: 0 },
    // Detailed analysis
    marketSize: { type: String, default: '' },
    revenueModel: { type: String, default: '' },
    competitiveAdvantage: { type: String, default: '' },
    recommendation: {
      type: String,
      enum: ['Invest', 'Consider', 'Avoid', 'Pending'],
      default: 'Pending',
    },
    recommendationReason: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ uploadedBy: 1, createdAt: -1 });
aiAnalysisSchema.index({ startup: 1 });
aiAnalysisSchema.index({ status: 1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
