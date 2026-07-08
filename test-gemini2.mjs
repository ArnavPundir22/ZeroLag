import { GoogleGenAI } from '@google/genai';
const apiKey = "AIzaSyBFInSQxQoq2LNk5S_Lgv0aaq5vCgMu-eY";
const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-omni-flash-preview',
      contents: "Hello"
    });
    console.log("Omni Flash response:", response.text);
  } catch (err) {
    console.error("Omni Flash error:", err);
  }
}
run();
