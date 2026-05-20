const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
