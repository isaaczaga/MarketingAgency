import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const { topic, duration, brandContext } = await request.json();

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        const prompt = `Generate a podcast script for a topic: "${topic}". 
The podcast should be approximately ${duration || 5} minutes long. 
Format the script with segments like [INTRO], [MAIN CONTENT], [CONCLUSION], and speaker names (e.g., HOST:).
Make it engaging and natural.`;

        const script = await generateWithGemini(prompt, brandContext);

        return NextResponse.json({
            script,
            estimatedDuration: duration || 5,
        });
    } catch (error) {
        console.error("Podcast script generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate podcast script" },
            { status: 500 }
        );
    }
}
