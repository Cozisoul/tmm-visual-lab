import { GoogleGenAI, Type } from "@google/genai";
import { Machine, SketchParams } from "../types";

// Helper to get the AI instance
const getAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestParameters = async (
  machine: Machine,
  currentParams: SketchParams,
  userPrompt: string
): Promise<SketchParams | null> => {
  const ai = getAi();
  if (!ai) return null;

  const model = "gemini-2.5-flash";

  const prompt = `
    You are the "Director" of a generative art studio. 
    The current machine is: ${machine.name} (${machine.department}).
    Description: ${machine.description}.
    
    The user wants to adjust the visual with this goal: "${userPrompt}".
    
    Here are the available controls and their definitions:
    ${JSON.stringify(machine.controls)}

    Current values:
    ${JSON.stringify(currentParams)}

    Return a JSON object containing ONLY the new parameter values that fulfill the user's request. 
    Do not invent keys that don't exist in the controls.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: machine.controls.reduce((acc, control) => {
                let propType = Type.STRING;
                if (control.type === 'number') propType = Type.NUMBER;
                if (control.type === 'boolean') propType = Type.BOOLEAN;
                
                acc[control.id] = { type: propType };
                return acc;
            }, {} as any)
        }
      },
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return null;
  }
};