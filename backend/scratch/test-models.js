require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}`);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, reply with only one word: Success"
    });
    console.log(`Result for ${modelName}:`, response.text.trim());
    return true;
  } catch (err) {
    console.error(`Error for ${modelName}:`, err.message || err);
    return false;
  }
}

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-flash-latest');
}

run();
