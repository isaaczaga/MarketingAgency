
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Using Imagen 3 as the reliable image generation model.
// "Nano Banana" (gemini-3-pro-image-preview) lists 'generateContent' 
// which typically returns text/multimodal, not direct image bytes via 'predict'.
// using Imagen 4 as the reliable image generation model.
const MODEL = "models/imagen-4.0-generate-001";

export async function generateNanoImages(prompt: string, count: number = 1) {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // Imagen uses the :predict endpoint
    const url = `${BASE_URL}/${MODEL}:predict?key=${API_KEY}`;

    const body = {
        instances: [
            {
                prompt: prompt
            }
        ],
        parameters: {
            sampleCount: count,
            aspectRatio: "16:9"
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image Gen Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Return list of base64 strings
    return data.predictions?.map((p: any) => p.bytesBase64Encoded) || [];
}
