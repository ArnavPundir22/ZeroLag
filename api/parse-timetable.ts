import { GoogleGenAI } from '@google/genai';
import { verifyToken } from '@clerk/backend';

// Simple in-memory rate limiter (per lambda instance)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  let decodedToken: any;
  try {
    decodedToken = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  // Rate Limiting Logic
  const userId = decodedToken.sub;
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > userRateLimit.resetTime) {
    // Reset window
    userRateLimit.count = 1;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    userRateLimit.count++;
  }
  
  rateLimitMap.set(userId, userRateLimit);

  if (userRateLimit.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'Too Many Requests. Please wait a minute before trying again.' });
  }

  const { base64Image, mimeType } = req.body || {};
  if (!base64Image || !mimeType) {
    return res.status(400).json({ error: 'Missing image data' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Gemini API Key' });
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Extract the timetable schedule from this image.
Return ONLY valid JSON that perfectly matches this structure exactly, with no markdown code blocks or backticks. Just raw JSON text.

[
  {
    "day": "Monday",
    "tasks": [
      {
        "title": "Course Name (Code)",
        "description": "Time: XX:XX - YY:YY\\nFaculty: Faculty Name\\nRoom: Room Number",
        "priority": "high",
        "labels": ["Lecture", "Core"],
        "dueDate": "YYYY-MM-DD"
      }
    ]
  }
]

Guidelines:
- Return an array of objects, one for each day.
- Guess priority (high for lectures/labs, low for breaks/self study).
- Guess labels based on content (e.g. "Lecture", "Lab", "Break", "Placement").
- Include all details visible in the image (Time, Faculty, Room).
- Extract any deadline or due date mentioned and include it as "dueDate" (in ISO format YYYY-MM-DD), otherwise leave it as an empty string.
- Do NOT wrap the JSON in \`\`\`json \`\`\`. Output just the raw array.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return res.status(200).json(JSON.parse(cleanText));
  } catch (error: any) {
    const correlationId = Math.random().toString(36).substring(2, 15);
    console.error(`[Correlation ID: ${correlationId}] AI Parser Error:`, error);
    
    if (error?.status === 429) {
      return res.status(429).json({ error: "API Quota Exceeded. You have reached your Gemini API usage limit.", correlationId });
    }
    if (error?.status === 400) {
      return res.status(400).json({ error: "Invalid API Key or Bad Request.", correlationId });
    }
    if (error?.status === 503) {
      return res.status(503).json({ error: "Google AI servers are currently overloaded.", correlationId });
    }
    return res.status(500).json({ error: "An unexpected internal error occurred. Please try again later.", correlationId });
  }
}
