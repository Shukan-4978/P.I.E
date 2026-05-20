const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF file
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extract text from a PPTX file (basic text extraction)
 */
async function extractTextFromPPTX(filePath) {
  // For PPTX, we do basic XML extraction since we don't use heavy libraries
  const AdmZip = require('adm-zip');
  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();
    let text = '';
    zipEntries.forEach((entry) => {
      if (entry.entryName.match(/ppt\/slides\/slide\d+\.xml/)) {
        const content = entry.getData().toString('utf8');
        // Strip XML tags and extract text
        const stripped = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        text += stripped + '\n';
      }
    });
    return text;
  } catch (err) {
    return 'Could not extract text from PPTX file.';
  }
}

/**
 * Main AI analysis function using Gemini
 */
async function analyzeWithOpenAI(filePath) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI Service is not configured: Missing GEMINI_API_KEY in .env file.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const ext = path.extname(filePath).toLowerCase();
  let extractedText = '';

  console.log(`[AI Service] Starting analysis for: ${filePath}`);

  try {
    if (ext === '.pdf') {
      extractedText = await extractTextFromPDF(filePath);
    } else if (ext === '.pptx' || ext === '.ppt') {
      extractedText = await extractTextFromPPTX(filePath);
    } else {
      throw new Error(`Unsupported file format (${ext}). Please upload PDF or PPTX.`);
    }
  } catch (err) {
    console.error(`[AI Service] Text extraction failed:`, err);
    throw new Error(`Text extraction failed: ${err.message}`);
  }

  const textLength = extractedText ? extractedText.trim().length : 0;
  console.log(`[AI Service] Extracted ${textLength} characters.`);

  if (textLength < 100) {
    throw new Error('Could not extract enough text from the document. Please ensure the file is not just images and is not password protected.');
  }

  // Clean text a bit
  const cleanText = extractedText.replace(/\s+/g, ' ').substring(0, 15000);

  const prompt = `You are an expert startup investment analyst. Analyze the following pitch deck content and provide a comprehensive evaluation.

PITCH DECK CONTENT:
${cleanText}

Analyze this pitch deck and respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "summary": "2-3 sentence overview of the startup",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "riskFactors": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "investmentScore": <number 0-100>,
  "marketScore": <number 0-100>,
  "problemClarity": <number 0-100>,
  "solutionStrength": <number 0-100>,
  "teamQuality": <number 0-100>,
  "revenueModelScore": <number 0-100>,
  "marketSize": "description of total addressable market",
  "revenueModel": "description of how the company makes money",
  "competitiveAdvantage": "what makes this startup unique",
  "recommendation": "Invest" OR "Consider" OR "Avoid",
  "recommendationReason": "1-2 sentence explanation of the recommendation"
}

Be honest, objective, and thorough in your analysis. Base scores on the quality of information presented.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    let content = response.text;
    console.log(`[AI Service] AI Response received.`);

    const result = JSON.parse(content);

    // Validate required fields
    const required = ['summary', 'strengths', 'weaknesses', 'investmentScore', 'recommendation'];
    for (const field of required) {
      if (result[field] === undefined) {
        throw new Error(`AI response missing required field: ${field}`);
      }
    }

    return result;
  } catch (err) {
    console.error(`[AI Service] Gemini or Parsing failed:`, err);
    throw new Error('AI analysis failed. Please try again later.');
  }
}

/**
 * AI Advisor Chatbot using Gemini
 */
async function generateChatbotResponse(userRole, userName, userMessage, chatHistory = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('AI Service is not configured: Missing GEMINI_API_KEY.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Define system instructions based on role
  let systemInstruction = "You are a helpful assistant for the P.I.E platform.";
  if (userRole === 'investor') {
    systemInstruction = `You are an expert AI Investment Advisor on the P.I.E platform (Platform for Investors & Entrepreneurs). 
You are speaking with an Investor named ${userName}.
Your goal is to provide intelligent tips on related investments, market trends, evaluating startups, due diligence, and portfolio management.
Keep your responses concise, professional, actionable, and formatted nicely.`;
  } else if (userRole === 'founder') {
    systemInstruction = `You are an expert AI Startup Growth Advisor on the P.I.E platform (Platform for Investors & Entrepreneurs). 
You are speaking with a Startup Founder named ${userName}.
Your goal is to provide intelligent tips and suggestions related to growing startups, securing funding, product-market fit, and pitching to investors.
Keep your responses concise, professional, actionable, and formatted nicely.`;
  }

  // Format history for Gemini
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      systemInstruction: systemInstruction,
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ]
    });

    return response.text;
  } catch (err) {
    console.error(`[AI Service] Chatbot generation failed:`, err.message || err);
    if (err.response) {
      console.error(`[AI Service] API Response:`, JSON.stringify(err.response.data));
    }
    throw new Error('Failed to generate response.');
  }
}

module.exports = { analyzeWithOpenAI, generateChatbotResponse };
