import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL part if present (e.g., "data:audio/mp3;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcription: {
      type: Type.STRING,
      description: "The verbatim transcription of the conversation with speaker labels (e.g., Speaker 0, Speaker 1)."
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        is_sales_call: { type: Type.BOOLEAN, description: "Is this a business conversation?" },
        customer_name: { type: Type.STRING, nullable: true, description: "Extract if mentioned" },
        summary: { type: Type.STRING, description: "2-sentence summary of the deal status" },
        topics_discussed: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of topics discussed"
        },
        customer_sentiment: {
          type: Type.STRING,
          enum: ["Positive", "Neutral", "Negative", "Hostile"],
          description: "Overall sentiment of the prospect"
        },
        objections_raised: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of reasons for hesitation"
        },
        action_items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              task: { type: Type.STRING },
              due_date: { type: Type.STRING, nullable: true }
            }
          },
          description: "Action items derived from the call"
        }
      },
      required: ["is_sales_call", "summary", "topics_discussed", "customer_sentiment", "objections_raised", "action_items"]
    }
  },
  required: ["transcription", "analysis"]
};

export const analyzeAudio = async (base64Audio: string, mimeType: string): Promise<AnalysisResult> => {
  const client = getClient();
  
  // Using gemini-2.5-flash-native-audio-preview-12-2025 as it is optimized for audio understanding
  // If this specific model is restricted to Live API, we would fallback to gemini-3-flash-preview.
  // Given the instruction to use native-audio for "conversation tasks", we use it here.
  const modelId = 'gemini-2.5-flash-native-audio-preview-12-2025';

  const prompt = `
    You are an AI Sales Operations Manager. Analyze the attached audio recording of a field sales conversation.
    
    1. Transcribe the conversation with clear Speaker labels (e.g., Speaker 0, Speaker 1).
    2. Analyze the content to extract business intelligence.
    
    Output the result in the specified JSON format containing both the transcription and the structured analysis.
  `;

  try {
    const response = await client.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response on flash model
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text received from Gemini.");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};