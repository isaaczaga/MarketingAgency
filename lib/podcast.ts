
import { generateWithGemini, BrandContext } from "@/lib/gemini";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function generatePodcastScript(topic: string, duration: number, brandContext?: BrandContext): Promise<string> {
    const prompt = `Generate a podcast script about "${topic}".
    Duration: ${duration} minutes.
    Context: ${brandContext ? `Brand: ${brandContext.title}, Tone: ${brandContext.brandVoice}` : "General"}.
    Format: Return ONLY the spoken dialogue. Do not include [Sound Effects], (Tone instructions), or Speaker Labels like "Host:".
    Start directly with the intro.`;

    const script = await generateWithGemini(prompt, brandContext);

    // Double cleaning to be safe (in case Gemini ignores instructions)
    const cleanScript = script
        .replace(/\[.*?\]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/^[A-Z\s]+:/gm, "")
        .replace(/Host:|Guest:/gi, "")
        .replace(/\*\*/g, "") // Remove bold markdown if any
        .trim();

    return cleanScript;
}

export async function generatePodcastAudio(text: string): Promise<ArrayBuffer> {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || "ElevenLabs API Error");
    }

    return await response.arrayBuffer();
}
