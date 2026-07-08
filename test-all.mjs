import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: "AIzaSyBFInSQxQoq2LNk5S_Lgv0aaq5vCgMu-eY" });

async function testModels() {
  const models = [
    'gemini-3.5-flash',
    'gemini-omni-flash-preview',
    'gemini-2.5-flash-native-audio-latest',
    'gemini-3.1-flash-live-preview',
    'gemini-robotics-er-1.6-preview'
  ];

  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Say 'hi'"
      });
      console.log(`Model ${model} SUCCESS:`, res.text);
      return;
    } catch(e) {
      console.log(`Model ${model} failed: ${e.status || e.message}`);
    }
  }
}
testModels();
