import { GoogleGenAI } from '@google/genai';
import { verifyToken } from '@clerk/backend';

// Simple in-memory rate limiter (per lambda instance)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Missing or invalid Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];
  let decodedToken: any;
  try {
    decodedToken = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err: any) {
    return res.status(401).json({
      error: 'Invalid Token',
      details: err.message || String(err)
    });
  }

  // Rate Limiting Logic
  const userId = decodedToken.sub;
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > userRateLimit.resetTime) {
    userRateLimit.count = 1;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    userRateLimit.count++;
  }

  rateLimitMap.set(userId, userRateLimit);

  if (userRateLimit.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'Too Many Requests. Please wait a minute before trying again.' });
  }

  const { content, columns = [], customPrompt = '' } = req.body || {};
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Missing or empty text content' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Gemini API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });

  const columnsContext = Array.isArray(columns) && columns.length > 0 
    ? `Available Board Columns: ${columns.join(', ')}`
    : 'Common columns: To Do, In Progress, Review, Done';

  const userInstructions = customPrompt ? `Additional user instructions: "${customPrompt}"` : '';

  const prompt = `
You are an expert project manager and agile task breakdown assistant.
Extract actionable task cards from the provided content (which may be Markdown, plain text, meeting notes, PRDs, or project specs).

${columnsContext}
${userInstructions}

Return ONLY valid JSON that strictly matches this exact structure (an array of task objects):
[
  {
    "title": "Concise, actionable task title (max 10 words)",
    "description": "Detailed explanation, subtasks checklist, or acceptance criteria in markdown format",
    "priority": "urgent" | "high" | "medium" | "low",
    "labels": ["Frontend", "Backend", "Bug", "Feature", "Docs", "Design", "Security", "Architecture"],
    "dueDate": "YYYY-MM-DD" (or "" if unknown),
    "suggestedColumn": "Column Name matching one of the available board columns"
  }
]

Guidelines:
1. Extract distinct, logically separated engineering tasks and user stories.
2. Formulate clear, punchy, imperative titles (e.g. "Implement user authentication flow", "Fix responsive navigation bug").
3. Preserve key context, sub-bullets, and technical details in the task description.
4. Estimate priority reasonably based on urgency/impact words (default to "medium" or "high").
5. Assign relevant labels (1 to 3 tags per task).
6. Pick the best matching suggestedColumn from available columns.
7. Do NOT wrap JSON in \`\`\`json \`\`\`. Output raw JSON text only.

Content to parse:
"""
${content.substring(0, 30000)}
"""
`;

  let lastError: any = null;

  // Model fallback loop across candidate Gemini models
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || '';
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanText);

      return res.status(200).json(parsedData);
    } catch (error: any) {
      lastError = error;
      console.warn(`Model ${modelName} failed with error (status: ${error?.status || 'unknown'}). Retrying next model if available...`);
      // If 503 or transient, delay briefly before fallback
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  const correlationId = Math.random().toString(36).substring(2, 15);
  console.error(`[Correlation ID: ${correlationId}] All AI Candidate Models Failed:`, lastError);

  if (lastError?.status === 429) {
    return res.status(429).json({ error: "API Quota Exceeded. You have reached your Gemini API usage limit.", correlationId });
  }
  if (lastError?.status === 400) {
    return res.status(400).json({ error: "Invalid API Key or Bad Request.", correlationId });
  }
  if (lastError?.status === 503) {
    return res.status(503).json({ error: "Google AI servers are temporarily busy. Please retry in a few seconds.", correlationId });
  }

  return res.status(500).json({ error: "An unexpected error occurred while parsing tasks. Please try again.", correlationId });
}
