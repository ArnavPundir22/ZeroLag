export const parseTimetableImage = async (file: File, token: string): Promise<any[]> => {
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

  const response = await fetch('/api/parse-timetable', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      base64Image,
      mimeType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
    throw new Error(errorMsg || "Failed to parse the timetable image.");
  }

  return data;
};
