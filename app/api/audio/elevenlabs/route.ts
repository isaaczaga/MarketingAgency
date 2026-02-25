import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { text, voiceId } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        // Get API key from environment or request headers
        const apiKey = process.env.ELEVENLABS_API_KEY || request.headers.get('x-elevenlabs-key');

        if (!apiKey) {
            return NextResponse.json(
                { error: "ElevenLabs API key not configured. Please add it in Settings." },
                { status: 401 }
            );
        }

        // Use the selected voice or default to Rachel
        const selectedVoice = voiceId || "21m00Tcm4TlvDq8ikWAM";

        // Call ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
            {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            console.error("ElevenLabs API error:", error);
            return NextResponse.json(
                { error: "Failed to generate audio. Please check your API key." },
                { status: response.status }
            );
        }

        // Get the audio buffer
        const audioBuffer = await response.arrayBuffer();

        // Return the audio file
        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": 'attachment; filename="podcast.mp3"',
            },
        });
    } catch (error) {
        console.error("Audio generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate audio" },
            { status: 500 }
        );
    }
}
