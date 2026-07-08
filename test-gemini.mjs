import { GoogleGenAI } from '@google/genai';
const apiKey = "AIzaSyBFInSQxQoq2LNk5S_Lgv0aaq5vCgMu-eY";
const ai = new GoogleGenAI({ apiKey });
async function run() {
  const models = await ai.models.list();
  for await (const m of models) {
    console.log(m.name);
  }
}
run();
