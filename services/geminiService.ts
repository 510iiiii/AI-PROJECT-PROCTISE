import { GoogleGenAI, Type } from "@google/genai";
import { HandGestureData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System instruction to guide the model
const SYSTEM_INSTRUCTION = `
You are a vision analysis engine for a 3D interactive art installation.
Your task is to analyze the user's hand in the image.
1. Detect if the hand is clearly OPEN (fingers spread) or CLOSED (fist/pinched).
2. Detect the approximate center position of the hand in the frame.
   - X: -1 (left) to 1 (right)
   - Y: -1 (bottom) to 1 (top)
If no hand is detected, return default values (isOpen: false, x: 0, y: 0).
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    isOpen: { type: Type.BOOLEAN },
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
  },
  required: ["isOpen", "x", "y"],
};

export const analyzeFrame = async (videoElement: HTMLVideoElement): Promise<HandGestureData> => {
  try {
    // Capture frame to base64
    const canvas = document.createElement("canvas");
    canvas.width = 320; // Low res for speed
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context");
    
    // Mirror the image for natural interaction
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const base64Data = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: "Analyze hand gesture." }
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return { isOpen: false, x: 0, y: 0 };
    
    const data = JSON.parse(text);
    return {
      isOpen: data.isOpen,
      x: Math.max(-1, Math.min(1, data.x)),
      y: Math.max(-1, Math.min(1, data.y)),
    };

  } catch (error) {
    console.error("Gemini Vision Error:", error);
    // Return neutral state on error
    return { isOpen: false, x: 0, y: 0 };
  }
};
