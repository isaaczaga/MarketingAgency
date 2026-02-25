"use client";

import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mic, Download, Volume2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMarketingPlan } from "@/lib/hooks/use-marketing-plan";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";

export default function PodcastPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <PodcastContent />
        </Suspense>
    );
}

function PodcastContent() {
    const { profile: brandProfile } = useBrandProfile();
    const { updateTaskStatus } = useMarketingPlan();
    const searchParams = useSearchParams();
    const router = useRouter();

    const taskId = searchParams.get("taskId");
    const initialTopic = searchParams.get("topic") || "";

    const [topic, setTopic] = useState(initialTopic);
    const [duration, setDuration] = useState("5");
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState("");
    const [error, setError] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [apiKey, setApiKey] = useState("");

    const handleGenerate = async () => {
        if (!topic) {
            setError("Please enter a topic");
            return;
        }

        setLoading(true);
        setError("");
        setScript("");
        setAudioUrl("");

        try {
            const response = await fetch("/api/generate/podcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    duration: parseInt(duration),
                    brandContext: brandProfile
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate podcast script");
            }

            const data = await response.json();
            setScript(data.script);
            toast.success("Podcast script generated!");

            if (taskId) {
                updateTaskStatus(taskId, 'completed');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!script) {
            setError("Please generate a script first");
            return;
        }

        setGeneratingAudio(true);
        setError("");

        try {
            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (apiKey) {
                headers["x-elevenlabs-key"] = apiKey;
            }

            // Clean the script to remove metadata, stage directions, and speaker labels
            const cleanText = script
                .replace(/\[.*?\]/g, "") // Remove [INTRO], [MUSIC], etc.
                .replace(/\(.*?\)/g, "") // Remove (tone), (sound FX), etc.
                .replace(/^[A-Z\s]+:/gm, "") // Remove SPEAKER: at start of lines
                .replace(/Host:|Guest:/gi, "") // Remove specific host/guest labels if inline
                .replace(/\n+/g, " ") // Collapse newlines
                .trim();

            console.log("Cleaned script for audio:", cleanText);

            const response = await fetch("/api/audio/elevenlabs", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    text: cleanText,
                    voiceId: "21m00Tcm4TlvDq8ikWAM" // Rachel voice
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate audio");
            }

            const audioBlob = await response.blob();
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            toast.success("Audio generated successfully!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate audio");
            toast.error(err instanceof Error ? err.message : "Failed to generate audio");
        } finally {
            setGeneratingAudio(false);
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `podcast-${topic.replace(/\s+/g, '-').toLowerCase()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Podcast Studio</h2>
                        <p className="text-muted-foreground">
                            Generate podcast scripts and convert them to professional audio using ElevenLabs AI voices.
                        </p>
                    </div>
                    {taskId && (
                        <Button variant="outline" onClick={() => router.push("/strategy")}>
                            Back to Strategy
                        </Button>
                    )}
                </div>
            </div>

            <Card className="p-6 mb-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="podcast-topic">Podcast Topic</Label>
                        <Input
                            id="podcast-topic"
                            placeholder="e.g., The Future of AI in Marketing"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="podcast-duration">Duration (minutes)</Label>
                        <Input
                            id="podcast-duration"
                            type="number"
                            placeholder="5"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key (Optional)</Label>
                        <Input
                            id="elevenlabs-api-key"
                            type="password"
                            placeholder="Leave empty to use environment variable"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Configure in .env.local or get your free API key at{" "}
                            <a
                                href="https://elevenlabs.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                elevenlabs.io
                            </a>
                        </p>
                    </div>
                    <Button onClick={handleGenerate} disabled={loading} className="w-full">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Mic className="h-4 w-4 mr-2" />
                        )}
                        Generate Podcast Script
                    </Button>
                    {error && (
                        <div className="text-sm text-red-500">{error}</div>
                    )}
                </div>
            </Card>

            {script && (
                <>
                    <Card className="p-6 mb-6">
                        <h3 className="font-semibold mb-4">Podcast Script</h3>
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className="min-h-[300px] font-mono text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerateAudio}
                                disabled={generatingAudio}
                                className="flex-1"
                            >
                                {generatingAudio ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Volume2 className="h-4 w-4 mr-2" />
                                )}
                                Generate Audio
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigator.clipboard.writeText(script)}
                            >
                                Copy Script
                            </Button>
                        </div>
                    </Card>

                    {audioUrl && (
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">Generated Audio</h3>
                            <audio
                                controls
                                src={audioUrl}
                                className="w-full mb-4"
                            />
                            <Button onClick={handleDownload} className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Download MP3
                            </Button>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
