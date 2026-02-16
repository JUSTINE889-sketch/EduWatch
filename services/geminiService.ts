
import { GoogleGenAI, Type } from "@google/genai";
import { IncidentType, Priority } from "../types";

// Fixed: Correct initialization of GoogleGenAI using named parameter and process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getWellnessTip = async () => {
  if (!process.env.API_KEY) return "Take a deep breath. You're doing better than you think.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a one-sentence, highly supportive and professional wellness tip or inspirational quote for a high school student. It should be compassionate and focus on mental resilience.",
    });
    return response.text;
  } catch (error) {
    return "Remember that your school community is here to support you.";
  }
};

export const analyzeIncident = async (description: string, type: IncidentType) => {
  if (!process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this student incident report:
      Type: ${type}
      Description: ${description}
      
      Provide a brief assessment including:
      1. Suggested Priority (Low, Medium, High, Critical)
      2. Key concerns
      3. Suggested immediate next steps for guidance office.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPriority: { type: Type.STRING },
            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};

export const translateText = async (text: string, targetLanguage: string) => {
  if (!process.env.API_KEY) return text;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text into ${targetLanguage}. Maintain the professional and compassionate tone. Only return the translated text: "${text}"`,
    });
    return response.text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
};

export const getResourceRecommendation = async (userMood: number, recentIncidents: string[]) => {
  if (!process.env.API_KEY) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `A student has a mood score of ${userMood}/5 and these recent incidents: ${recentIncidents.join(', ')}. 
      Which of these resources should they prioritize? 
      1. Emergency Contacts 
      2. Upstander Guide 
      3. Digital Responsibility 
      4. Mindfulness Exercises
      
      Select the most relevant one and explain why in one short sentence.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedResource: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};

export const findPatterns = async (currentIncident: string, historySummaries: string[]) => {
  if (!process.env.API_KEY || historySummaries.length === 0) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this new incident against historical records to find patterns or recurring issues.
      NEW INCIDENT: ${currentIncident}
      HISTORY: ${historySummaries.join(' | ')}
      
      Identify if this student is a repeat offender, a repeated victim, or if this is part of a larger school trend.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPattern: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER, description: "0 to 1" },
            finding: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Pattern detection failed:", error);
    return null;
  }
};

export const getChatAssistantResponse = async (history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  if (!process.env.API_KEY) return "I'm sorry, my AI processing is currently unavailable. Please contact the Guidance Office directly.";

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are the EduWatch AI Assistant, a compassionate and professional high school guidance counselor. 
        Your goal is to support students, parents, and teachers. 
        - If a student is upset, offer empathy first.
        - Help them understand if an incident (like bullying or academic dishonesty) should be reported.
        - Explain that reports can be anonymous.
        - Provide immediate calming advice (like breathing exercises) if they seem stressed.
        - Always encourage them to talk to a human counselor for serious matters.
        - Keep responses concise and student-friendly.`,
        temperature: 0.7,
      }
    });

    const lastMsg = history[history.length - 1].parts[0].text;
    const result = await chat.sendMessage({ message: lastMsg });
    return result.text;
  } catch (error) {
    console.error("Chat failed:", error);
    return "I'm having a bit of trouble connecting right now. Take a deep breath, and remember that our human staff are always here to help in the Guidance Office.";
  }
};
