import { GoogleGenerativeAI } from "@google/generative-ai";

export interface BrandContext {
    title?: string;
    description?: string;
    brandVoice?: string;
    targetAudience?: string;
    keywords?: string[];
}

export async function generateWithGemini(prompt: string, context?: BrandContext) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let finalPrompt = prompt;
    if (context) {
        const contextString = `
Brand Context:
- Title: ${context.title || "N/A"}
- Description: ${context.description || "N/A"}
- Brand Voice: ${context.brandVoice || "N/A"}
- Target Audience: ${context.targetAudience || "N/A"}
- Keywords: ${context.keywords?.join(", ") || "N/A"}
`;
        finalPrompt = `${contextString}\n\nTask: ${prompt}`;
    }

    try {
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini generation error:", error);
        throw new Error(`Gemini AI Error: ${error.message}`);
    }
}
