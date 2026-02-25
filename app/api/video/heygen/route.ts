import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/lib/auth-server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyServerAuth(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { script, avatarId } = await request.json();

        if (!script) {
            return NextResponse.json(
                { error: "Script is required" },
                { status: 400 }
            );
        }

        // Get API key from environment or request headers
        const apiKey = process.env.HEYGEN_API_KEY || request.headers.get('x-heygen-key');

        if (!apiKey) {
            return NextResponse.json(
                { error: "HeyGen API key not configured. Please add it in Settings." },
                { status: 401 }
            );
        }

        // Create video generation request
        const response = await fetch(
            "https://api.heygen.com/v2/video/generate",
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "X-Api-Key": apiKey,
                },
                body: JSON.stringify({
                    video_inputs: [
                        {
                            character: {
                                type: "avatar",
                                avatar_id: avatarId || "8b0a9ae8e76541baa2be676d04600e04",
                                avatar_style: "normal",
                            },
                            voice: {
                                type: "text",
                                input_text: script,
                                voice_id: "1c651b8254304a298f6f35585f2e1d04",
                            },
                        },
                    ],
                    dimension: {
                        width: 1920,
                        height: 1080,
                    },
                    aspect_ratio: "16:9",
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("HeyGen API error:", error);
            return NextResponse.json(
                { error: "Failed to generate video. Please check your API key and quota." },
                { status: response.status }
            );
        }

        const data = await response.json();

        // HeyGen returns a video_id that you can use to check status
        return NextResponse.json({
            videoId: data.data?.video_id,
            status: "processing",
            message: "Video generation started. Use the video ID to check status.",
        });
    } catch (error) {
        console.error("Video generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate video" },
            { status: 500 }
        );
    }
}

// Endpoint to check video generation status
export async function GET(request: NextRequest) {
    try {
        const user = await verifyServerAuth(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const videoId = request.nextUrl.searchParams.get('videoId');
        const apiKey = process.env.HEYGEN_API_KEY || request.headers.get('x-heygen-key');

        if (!videoId || !apiKey) {
            return NextResponse.json(
                { error: "Video ID and API key required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
            {
                headers: {
                    "X-Api-Key": apiKey,
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to get video status" },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            status: data.data?.status,
            videoUrl: data.data?.video_url,
            thumbnail: data.data?.thumbnail_url,
        });
    } catch (error) {
        console.error("Status check error:", error);
        return NextResponse.json(
            { error: "Failed to check video status" },
            { status: 500 }
        );
    }
}
