export interface ParsedTask {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  labels: string[];
  dueDate?: string;
  suggestedColumn?: string;
}

export const parseTasksFromContent = async (
  content: string,
  token: string,
  columns: string[] = [],
  customPrompt: string = ''
): Promise<ParsedTask[]> => {
  const response = await fetch('/api/parse-tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      content,
      columns,
      customPrompt
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
    throw new Error(errorMsg || "Failed to parse tasks from content.");
  }

  if (!Array.isArray(data)) {
    throw new Error("Invalid response format received from AI server.");
  }

  return data;
};
