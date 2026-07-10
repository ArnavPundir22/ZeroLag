import { GoogleGenAI } from '@google/genai';

export const parseTimetableImage = async (file: File, apiKey: string): Promise<any[]> => {
  const ai = new GoogleGenAI({ apiKey });

  // Convert File to base64
  const base64Image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  
  const mimeType = file.type;

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
    
    // Clean up potential markdown formatting if the model still includes it
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error: any) {
    console.error("AI Parser Error:", error);
    
    // Check for specific API error statuses
    if (error?.status === 429) {
      throw new Error("API Quota Exceeded. You have reached your Gemini API usage limit. Please try again later or upgrade your Google AI Studio plan.");
    }
    if (error?.status === 400) {
      throw new Error("Invalid API Key. Please ensure your VITE_GEMINI_API_KEY is correct in your .env.local file.");
    }
    if (error?.status === 503) {
      throw new Error("Google AI servers are currently overloaded. Please try again in a few minutes.");
    }
    
    throw new Error(error?.message || "Failed to parse the timetable image. Please ensure the image is clear and the API key is valid.");
  }
};
