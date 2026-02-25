"use client";

import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon, FileText, Download, Copy, RefreshCw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";

export default function AssetsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <AssetsContent />
        </Suspense>
    );
}

function AssetsContent() {
    const { profile: brandProfile } = useBrandProfile();
    const router = useRouter();

    const [topic, setTopic] = useState("");
    const [loadingScript, setLoadingScript] = useState(false);
    const [loadingImages, setLoadingImages] = useState(false);

    // Assets
    const [script, setScript] = useState("");
    const [images, setImages] = useState<string[]>([]);

    const [error, setError] = useState("");

    const handleGenerateScript = async () => {
        if (!topic) {
            setError("Please enter a topic");
            return;
        }

        setLoadingScript(true);
        setError("");

        try {
            const response = await fetch("/api/generate/video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: `Write a 60-second video script for Google Vids about: ${topic}. Format it with [Visual Scene] and (Narrator Voiceover) sections.`,
                    duration: 60,
                    brandContext: brandProfile
                }),
            });

            if (!response.ok) throw new Error("Failed to generate script");

            const data = await response.json();
            setScript(data.script);
            toast.success("Script generated!");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error generating script");
        } finally {
            setLoadingScript(false);
        }
    };

    const handleGenerateImages = async () => {
        if (!topic) {
            setError("Please enter a topic first");
            return;
        }

        setLoadingImages(true);
        setError("");
        setImages([]);

        try {
            // Generate 3 images based on the topic
            // We could parse the script for scenes, but for now we use the topic for generic storyboard assets
            const prompts = [
                `Cinematic wide shot of ${topic}, professional lighting, 4k`,
                `Close up detail shot related to ${topic}, high resolution`,
                `Lifestyle or action shot representing ${topic}, vibrant colors`
            ];

            // Trigger parallel generation or sequential? 
            // Our API handles 'count' in parameters for Imagen.
            // Let's ask for 3 variations of the main topic for now to save time/quota
            // Or better, one generic request.

            const response = await fetch("/api/generate/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `High quality photo of ${topic}, professional marketing asset, cinematic lighting`,
                    count: 3
                }),
            });

            if (!response.ok) throw new Error("Failed to generate images");

            const data = await response.json();
            setImages(data.images || []);
            toast.success("Nano Banana images generated!");

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error generating images");
        } finally {
            setLoadingImages(false);
        }
    };

    const handleDownloadImage = (base64: string, index: number) => {
        const link = document.createElement("a");
        link.href = `data:image/png;base64,${base64}`;
        link.download = `nano-asset-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Google Vids Asset Generator</h2>
                    <p className="text-muted-foreground">
                        Generate scripts and Nano Banana images to use in your Google Vids projects.
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/content/video")}>
                    Go to Ingestion
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Control Panel */}
                <Card className="p-6 md:col-span-1 h-fit">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Video Topic</Label>
                            <Input
                                placeholder="e.g. New Summer Collection Launch"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleGenerateScript}
                            disabled={loadingScript || !topic}
                            className="w-full"
                        >
                            {loadingScript ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                            1. Generate Script
                        </Button>

                        <Button
                            onClick={handleGenerateImages}
                            disabled={loadingImages || !topic}
                            variant="secondary"
                            className="w-full"
                        >
                            {loadingImages ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                            2. Generate Images (Nano)
                        </Button>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                </Card>

                {/* Results Panel */}
                <div className="md:col-span-2 space-y-6">

                    {/* Script Section */}
                    {script && (
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Video Script</h3>
                                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(script)}>
                                    <Copy className="h-4 w-4 mr-2" /> Copy
                                </Button>
                            </div>
                            <Textarea
                                value={script}
                                readOnly
                                className="min-h-[200px] font-mono text-sm"
                            />
                        </Card>
                    )}

                    {/* Images Section */}
                    {images.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-semibold mb-4">Nano Banana Assets</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {images.map((img, i) => (
                                    <div key={i} className="group relative rounded-lg overflow-hidden border bg-muted">
                                        <img
                                            src={`data:image/png;base64,${img}`}
                                            alt={`Asset ${i}`}
                                            className="w-full h-auto object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" onClick={() => handleDownloadImage(img, i)}>
                                                <Download className="h-4 w-4 mr-2" /> Download
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
