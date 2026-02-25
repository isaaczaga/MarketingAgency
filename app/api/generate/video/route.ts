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

        const prompt = `Generate a video script for an AI avatar video.
Topic: "${topic}"
Estimated Duration: ${duration || 60} seconds.
The script should include:
- [OPENING]: A hook to grab attention.
- [MAIN CONTENT]: Key benefits and points.
- [CALL TO ACTION]: A clear next step.
- Voiceover lines and brief [Visual] descriptions.
Keep it concise and punchy.`;

        const script = await generateWithGemini(prompt, brandContext);

        return NextResponse.json({
            script,
            estimatedDuration: duration || 60,
        });
    } catch (error) {
        console.error("Video script generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate video script" },
            { status: 500 }
        );
    }
}
