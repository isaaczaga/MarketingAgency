"use client";

import { useState, Suspense } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";
import { useMarketingPlan } from "@/lib/hooks/use-marketing-plan";

export default function ArticlesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ArticlesContent />
        </Suspense>
    );
}

function ArticlesContent() {
    const { profile: brandProfile } = useBrandProfile();
    const { updateTaskStatus } = useMarketingPlan();
    const searchParams = useSearchParams();
    const router = useRouter();

    const taskId = searchParams.get("taskId");
    const initialTopic = searchParams.get("topic") || "";

    const [topic, setTopic] = useState(initialTopic);
    const [keywords, setKeywords] = useState("");
    const [loading, setLoading] = useState(false);
    const [article, setArticle] = useState("");
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        if (!topic) {
            setError("Please enter a topic");
            return;
        }

        setLoading(true);
        setError("");
        setArticle("");

        try {
            const response = await fetch("/api/generate/article", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    keywords,
                    brandContext: brandProfile
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate article");
            }

            const data = await response.json();
            setArticle(data.content);
            toast.success("Article generated!");

            // Update plan if task exists
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

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Article Generator</h2>
                        <p className="text-muted-foreground">
                            Generate SEO-optimized blog posts and articles for your campaigns.
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
                        <Label htmlFor="topic">Article Topic</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Benefits of Digital Marketing for Small Businesses"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Input
                            id="keywords"
                            placeholder="e.g., digital marketing, SEO, social media"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={loading} className="w-full">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <FileText className="h-4 w-4 mr-2" />
                        )}
                        Generate Article
                    </Button>
                    {error && (
                        <div className="text-sm text-red-500">{error}</div>
                    )}
                </div>
            </Card>

            {article && (
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Generated Article</h3>
                    <div className="prose max-w-none">
                        <Textarea
                            value={article}
                            onChange={(e) => setArticle(e.target.value)}
                            className="min-h-[400px] font-mono text-sm"
                        />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(article)}>
                            Copy to Clipboard
                        </Button>
                        <Button variant="outline">
                            Export as Markdown
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}
