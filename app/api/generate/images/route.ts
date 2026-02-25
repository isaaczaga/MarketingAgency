
import { NextRequest, NextResponse } from "next/server";
import { generateNanoImages } from "@/lib/nano";

export async function POST(request: NextRequest) {
    try {
        const { prompt, count } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const images = await generateNanoImages(prompt, count || 1);

        return NextResponse.json({ images });

    } catch (error: any) {
        console.error("Image Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate images" },
            { status: 500 }
        );
    }
}
