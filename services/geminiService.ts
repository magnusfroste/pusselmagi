import { GoogleGenAI } from "@google/genai";
import { Theme } from "../types";

// Gemini-klienten skapas forst nar den behovs: appen maste fungera utan API-nyckel.
let ai: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI | null => {
  if (ai) return ai;
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
  if (!apiKey) return null;
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const generatePraise = async (theme: Theme, timeSeconds: number, rows: number, cols: number): Promise<string> => {
  try {
    const client = getGeminiClient();
    if (!client) throw new Error('Ingen API-nyckel: anvander lokal berommelse');
    const model = client.models;
    
    // Swedish prompt for localization
    const prompt = `
      Du är en uppmuntrande vän till ett barn som precis har klarat ett pussel.
      Temat var "${theme}".
      Svårighetsgraden var ${rows}x${cols} bitar (${rows*cols} totalt).
      Det tog ${timeSeconds} sekunder.
      
      Skriv en kort, superglad och magisk mening på svenska som berömmer barnet. 
      Använd emojis! 
      Referera gärna till temat (t.ex. om det är rymden, säg "Du är snabbare än en komet!").
      Håll det under 20 ord.
    `;

    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini praise generation failed:", error);
    // Fallback messages in Swedish
    const fallbacks = [
      "Bra jobbat! Du är en stjärna! 🌟",
      "Wow! Vilket pusselproffs du är! 🧩✨",
      "Fantastiskt! Du klarade det! 🎉",
      "Snyggt jobbat! Inget stoppar dig! 🚀"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};

export const getThemeImagePrompt = (theme: Theme): string => {
  // Mapping themes to Picsum keywords/seeds for consistent but varied imagery
  switch (theme) {
    case 'animals': return 'puppy,kitten,wildlife';
    case 'space': return 'galaxy,planet,astronaut';
    case 'fantasy': return 'castle,dragon,magic';
    case 'nature': return 'forest,mountain,flower';
    default: return 'abstract';
  }
};