import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: "AIzaSyBFInSQxQoq2LNk5S_Lgv0aaq5vCgMu-eY" });

async function testModels() {
  const models = await ai.models.list();
  for await (const m of models) {
    if (m.name.includes('flash') || m.name.includes('pro')) {
      try {
        const res = await ai.models.generateContent({
          model: m.name,
          contents: "hi"
        });
        console.log(`Model ${m.name} SUCCESS`);
      } catch(e) {
        // console.log(`Model ${m.name} failed`);
      }
    }
  }
}
testModels();
