import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const { topic, keywords, brandContext } = await request.json();

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        const prompt = `Write a professional blog article about "${topic}".
Include these keywords if possible: ${keywords || "relevant industry terms"}.
The article should be around 800-1000 words.
Use Markdown formatting with clear H1, H2, and H3 headers.
Make it informative, SEO-optimized, and well-structured.`;

        const article = await generateWithGemini(prompt, brandContext);

        return NextResponse.json({
            content: article,
            wordCount: article.split(/\s+/).length,
        });
    } catch (error) {
        console.error("Article generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate article" },
            { status: 500 }
        );
    }
}
