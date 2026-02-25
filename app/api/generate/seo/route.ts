import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { topic, brandContext } = await request.json();

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const prompt = `
Generate a comprehensive SEO and Keyword Research strategy for the following topic:
Topic: ${topic}
Brand Context: ${brandContext?.title} - ${brandContext?.description}

The response MUST be a valid JSON object with the following structure:
{
  "focusKeywords": [
    { "keyword": "string", "volume": "High/Medium/Low", "difficulty": "0-100", "intent": "Informational/Commercial/Transactional" }
  ],
  "contentPillars": [
    { "title": "string", "description": "string" }
  ],
  "onPageRecommendations": ["string"],
  "backlinkStrategy": "string"
}

Provide at least 5 focus keywords and 3 content pillars. Ensure the advice is actionable and professional.
`;

        const responseText = await generateWithGemini(prompt);
        const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const seoStrategy = JSON.parse(jsonString);

        return NextResponse.json(seoStrategy);

    } catch (error: any) {
        console.error("SEO generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
