"use client";

import { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, TrendingUp, BookOpen, Target, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";
import { useMarketingPlan } from "@/lib/hooks/use-marketing-plan";

interface Keyword {
    keyword: string;
    volume: string;
    difficulty: string;
    intent: string;
}

interface ContentPillar {
    title: string;
    description: string;
}

interface SEOStrategy {
    focusKeywords: Keyword[];
    contentPillars: ContentPillar[];
    onPageRecommendations: string[];
    backlinkStrategy: string;
}

export default function SEOPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" /><p>Loading SEO Tool...</p></div>}>
            <SEOContent />
        </Suspense>
    );
}

function SEOContent() {
    const { profile } = useBrandProfile();
    const { updateTaskStatus } = useMarketingPlan();
    const searchParams = useSearchParams();
    const router = useRouter();

    const taskId = searchParams.get("taskId");
    const initialTopic = searchParams.get("topic") || "";

    const [topic, setTopic] = useState(initialTopic);
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState<SEOStrategy | null>(null);

    const handleGenerateSEO = async () => {
        if (!topic) {
            toast.error("Please enter a topic");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/generate/seo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    brandContext: profile
                }),
            });

            if (!response.ok) throw new Error("Failed to generate SEO strategy");

            const data = await response.json();
            setStrategy(data);
            toast.success("SEO Strategy generated!");

            if (taskId) {
                updateTaskStatus(taskId, 'completed');
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while generating the strategy");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">SEO & Keyword Research</h2>
                    <p className="text-muted-foreground">
                        Generate data-driven keywords and content strategies.
                    </p>
                </div>
                {taskId && (
                    <Button variant="outline" onClick={() => router.push("/strategy")}>
                        Back to Strategy
                    </Button>
                )}
            </div>

            <Card className="p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Target Topic or Industry</Label>
                        <div className="flex gap-4">
                            <Input
                                id="topic"
                                placeholder="e.g., Luxury Real Estate in Mexico City"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="text-lg"
                            />
                            <Button onClick={handleGenerateSEO} disabled={loading} size="lg">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Search className="h-4 w-4 mr-2" />
                                )}
                                Analyze SEO
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {strategy && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg mb-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            Focus Keywords
                        </div>
                        <div className="divide-y">
                            {strategy.focusKeywords.map((kw, i) => (
                                <div key={i} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{kw.keyword}</p>
                                        <p className="text-xs text-muted-foreground uppercase">{kw.intent}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 rounded border">Vol: {kw.volume}</span>
                                        <p className="text-[10px] text-muted-foreground mt-1">Difficulty: {kw.difficulty}/100</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg mb-2">
                            <BookOpen className="h-5 w-5 text-green-500" />
                            Content Pillars
                        </div>
                        <div className="space-y-4">
                            {strategy.contentPillars.map((pillar, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg border">
                                    <p className="font-semibold text-sm mb-1">{pillar.title}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{pillar.description}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg mb-2">
                            <Target className="h-5 w-5 text-amber-500" />
                            On-Page & Backlink Strategy
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recommendations</h4>
                                <ul className="space-y-2">
                                    {strategy.onPageRecommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Backlink Focus</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {strategy.backlinkStrategy}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
