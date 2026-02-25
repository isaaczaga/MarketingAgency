import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Fetch the website
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            next: { revalidate: 0 }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch website: ${response.status} ${response.statusText}` },
                { status: 400 }
            );
        }

        const html = await response.text();

        const root = parse(html);

        // Extract metadata
        const title = root.querySelector("title")?.text || root.querySelector('meta[property="og:title"]')?.getAttribute("content") || "No title found";
        const description =
            root.querySelector('meta[name="description"]')?.getAttribute("content") ||
            root.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
            "No description found";

        // Extract keywords
        const keywordsContent = root.querySelector('meta[name="keywords"]')?.getAttribute("content");
        const keywords = keywordsContent
            ? keywordsContent.split(",").map((k: string) => k.trim()).slice(0, 10)
            : ["No keywords found"];

        // Extract text content for analysis
        const bodyText = root.querySelector("body")?.text.replace(/\s+/g, " ").trim().slice(0, 5000) || "";

        // Simple brand voice analysis (in production, use AI)
        const brandVoice = analyzeBrandVoice(bodyText, title);
        const targetAudience = analyzeTargetAudience(bodyText, description);

        return NextResponse.json({
            url,
            title,
            description,
            keywords,
            brandVoice,
            targetAudience,
        });
    } catch (error: any) {
        console.error("Analysis error details:", {
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json(
            { error: `Failed to analyze website: ${error.message}` },
            { status: 500 }
        );
    }
}

function analyzeBrandVoice(text: string, title: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("innovative") || lowerText.includes("cutting-edge") || lowerText.includes("technology")) {
        return "Innovative and tech-forward, emphasizing modern solutions and forward-thinking approaches.";
    } else if (lowerText.includes("professional") || lowerText.includes("enterprise") || lowerText.includes("business")) {
        return "Professional and business-oriented, focusing on reliability and corporate values.";
    } else if (lowerText.includes("friendly") || lowerText.includes("community") || lowerText.includes("together")) {
        return "Friendly and community-focused, emphasizing connection and collaboration.";
    } else if (lowerText.includes("luxury") || lowerText.includes("premium") || lowerText.includes("exclusive")) {
        return "Premium and exclusive, highlighting quality and sophistication.";
    } else {
        return "Informative and straightforward, providing clear value propositions.";
    }
}

function analyzeTargetAudience(text: string, description: string): string {
    const combined = (text + " " + description).toLowerCase();

    if (combined.includes("business") || combined.includes("enterprise") || combined.includes("b2b")) {
        return "Business professionals and enterprises seeking scalable solutions.";
    } else if (combined.includes("developer") || combined.includes("api") || combined.includes("code")) {
        return "Developers and technical professionals looking for tools and integrations.";
    } else if (combined.includes("small business") || combined.includes("startup") || combined.includes("entrepreneur")) {
        return "Small business owners and entrepreneurs seeking growth opportunities.";
    } else if (combined.includes("consumer") || combined.includes("customer") || combined.includes("user")) {
        return "General consumers looking for user-friendly products and services.";
    } else {
        return "Diverse audience interested in the brand's core offerings and values.";
    }
}
