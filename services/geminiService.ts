import { GoogleGenAI } from "@google/genai";
import { Theme } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePraise = async (theme: Theme, timeSeconds: number, rows: number, cols: number): Promise<string> => {
  try {
    const model = ai.models;
    
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