require('dotenv').config({ path: '.env' });
const { generateChatbotResponse } = require('../services/aiService');

async function test() {
  try {
    console.log("Starting test chat response...");
    console.log("Using API key:", process.env.GEMINI_API_KEY ? "Yes (length " + process.env.GEMINI_API_KEY.length + ")" : "No");
    const res = await generateChatbotResponse('founder', 'John', 'Hello, how can I raise seed funding?', []);
    console.log("AI Response:", res);
  } catch (err) {
    console.error("AI Error occurred:", err);
  }
}

test();
