import { GoogleGenAI } from "@google/genai";

// Initialize the client with the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImageWithGemini = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    // We use gemini-2.5-flash for speed and efficiency in analyzing images
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: "Analyze this image for a PDF report. Provide a professional, concise 1-sentence caption describing the visual content. If there is clear text, extract the most important part of it after the caption.",
          },
        ],
      },
    });

    return response.text || "No description available.";
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "AI Analysis failed for this image.";
  }
};
