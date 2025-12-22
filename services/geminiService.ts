import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Разбей задачу "${taskTitle}" на 3-5 коротких, конкретных подзадач для чек-листа. Отвечай только JSON массивом строк.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const subtasks = JSON.parse(jsonText);
    return Array.isArray(subtasks) ? subtasks : [];
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};