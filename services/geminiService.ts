
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Always use process.env.API_KEY directly for initialization as per @google/genai guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getStudyHelp(prompt: string, moduleContext?: string) {
    const systemInstruction = `
      You are an expert AI Study Tutor. 
      Your goal is to help students understand complex topics, summarize modules, and test their knowledge.
      Be encouraging, clear, and concise.
      ${moduleContext ? `Context about the current study module: ${moduleContext}` : ''}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      // The response.text property directly returns the generated string
      return response.text || "I'm sorry, I couldn't generate a response right now.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "There was an error communicating with the AI. Please check your connection.";
    }
  }
}

export const geminiService = new GeminiService();
