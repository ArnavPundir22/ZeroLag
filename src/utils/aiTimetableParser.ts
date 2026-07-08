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
        "labels": ["Lecture", "Core"] 
      }
    ]
  }
]

Guidelines:
- Return an array of objects, one for each day.
- Guess priority (high for lectures/labs, low for breaks/self study).
- Guess labels based on content (e.g. "Lecture", "Lab", "Break", "Placement").
- Include all details visible in the image (Time, Faculty, Room).
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
      ]
    });

    const text = response.text || '';
    
    // Clean up potential markdown formatting if the model still includes it
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("AI Parser Error:", error);
    throw new Error("Failed to parse the timetable image. Please ensure the image is clear and the API key is valid.");
  }
};
