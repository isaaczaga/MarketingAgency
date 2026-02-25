"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Globe, Sparkles, Target, Hash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";
import { toast } from "sonner";

interface BrandProfile {
    url: string;
    title: string;
    description: string;
    keywords: string[];
    brandVoice: string;
    targetAudience: string;
}

export default function AnalysisPage() {
    const { profile: savedProfile, saveProfile } = useBrandProfile();
    const router = useRouter();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<BrandProfile | null>(null);
    const [error, setError] = useState("");
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [autoExecute, setAutoExecute] = useState(false);

    // Initialize with saved profile if it exists
    useEffect(() => {
        if (savedProfile) {
            setProfile(savedProfile);
            setUrl(savedProfile.url);
        }
    }, [savedProfile]);

    const handleAnalyze = async () => {
        if (!url) {
            setError("Please enter a URL");
            return;
        }

        setLoading(true);
        setError("");
        setProfile(null);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze website");
            }

            const data = await response.json();
            setProfile(data);
            saveProfile({ ...data, url });
            toast.success("Brand analysis complete!");

            // Trigger automation if enabled
            if (autoExecute) {
                toast.info("Auto-Pilot active: Generating strategy...");
                setTimeout(() => handleGeneratePlan(data), 1000);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "An error occurred";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePlan = async (targetProfile?: BrandProfile) => {
        const profileToUse = targetProfile || profile;
        if (!profileToUse) return;
        setGeneratingPlan(true);
        try {
            const response = await fetch("/api/generate/strategy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandProfile: profileToUse }),
            });
            const strategy = await response.json();

            // Save to marketing plan
            const newPlan = {
                id: Math.random().toString(36).substring(7),
                url: profileToUse.url,
                brandProfile: profileToUse,
                strategy: strategy,
                createdAt: new Date().toISOString()
            };
            localStorage.setItem("marketing_plan", JSON.stringify(newPlan));
            toast.success("Master Plan generated!");

            const targetPath = `/strategy${autoExecute ? "?autoStart=true" : ""}`;
            router.push(targetPath);
        } catch (err) {
            toast.error("Failed to generate strategy");
        } finally {
            setGeneratingPlan(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Brand Analysis</h2>
                <p className="text-muted-foreground">
                    Enter a business website URL to analyze brand voice, keywords, and target audience.
                </p>
            </div>

            <Card className="p-6 mb-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                            />
                            <Button onClick={handleAnalyze} disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Analyze</span>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="auto-execute"
                            checked={autoExecute}
                            onChange={(e) => setAutoExecute(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        />
                        <Label htmlFor="auto-execute" className="text-sm font-medium cursor-pointer">
                            🚀 Auto-Pilot: Execute master plan immediately after generation
                        </Label>
                    </div>
                    {error && (
                        <div className="text-sm text-red-500">{error}</div>
                    )}
                </div>
            </Card>

            {profile && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950 p-6 rounded-xl border border-blue-100 dark:border-blue-900">
                        <div>
                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">Brand Strategy Ready</h3>
                            <p className="text-blue-700 dark:text-blue-300">We&apos;ve identified your core brand identity. Ready to build your complete marketing plan?</p>
                        </div>
                        <Button
                            onClick={() => handleGeneratePlan()}
                            disabled={generatingPlan}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 px-8"
                        >
                            {generatingPlan ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="h-5 w-5 mr-2" />
                            )}
                            🚀 Generate Master Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">Website Title</h3>
                            <p>{profile.title}</p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p>{profile.description}</p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">Keywords</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.keywords.map((keyword, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">Brand Voice</h3>
                            <p>{profile.brandVoice}</p>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-semibold mb-2">Target Audience</h3>
                            <p>{profile.targetAudience}</p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
