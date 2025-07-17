
import { GoogleGenAI } from "@google/genai";
import { ProductCategory } from '../types';

if (!process.env.API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we assume the key is set.
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateDescription = async (
  productName: string,
  category: ProductCategory
): Promise<string> => {
  if (!process.env.API_KEY) {
     return "Función de IA no disponible. Configure la API_KEY.";
  }

  const prompt = `Genera una descripción de producto atractiva y concisa en español para un producto llamado "${productName}" en la categoría de "${category}". La descripción debe ser de 2 o 3 frases como máximo y resaltar un beneficio clave. No uses markdown.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 1,
            topK: 32,
            maxOutputTokens: 100,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "Hubo un error al generar la descripción.";
  }
};
