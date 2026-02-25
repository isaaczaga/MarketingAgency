"use client";

import { useState, useEffect, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";
import { useMarketingPlan } from "@/lib/hooks/use-marketing-plan";

export default function CampaignsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <CampaignsContent />
        </Suspense>
    );
}

function CampaignsContent() {
    const { profile } = useBrandProfile();
    const { plan, updateTaskStatus } = useMarketingPlan();
    const searchParams = useSearchParams();
    const router = useRouter();

    const taskId = searchParams.get("taskId");
    const initialName = searchParams.get("topic") || "";

    const [loading, setLoading] = useState(false);
    const [socialContent, setSocialContent] = useState("");
    const [googleCampaign, setGoogleCampaign] = useState({
        name: initialName,
        headline: "",
        description: "",
        budget: "50",
        url: "",
        keywords: ""
    });

    useEffect(() => {
        if (profile) {
            setGoogleCampaign(prev => ({
                ...prev,
                url: profile.url || prev.url || "",
                keywords: profile.keywords?.join(", ") || prev.keywords || ""
            }));
        }

        // Logic to pre-fill from generated output in the plan
        if (plan && taskId && !socialContent) {
            const allTasks = plan.strategy.phases.flatMap(p => p.tasks);
            const currentTask = allTasks.find(t => t.id === taskId);

            if (currentTask?.result) {
                // If the current task already has a result (e.g. from Auto-Pilot), use it
                setSocialContent(currentTask.result);
                setGoogleCampaign(prev => ({
                    ...prev,
                    description: currentTask.description
                }));
            } else {
                // look for related content (fuzzier match)
                const keywords = initialName.toLowerCase().split(' ').filter(w => w.length > 3);
                const relatedTask = allTasks.find(t =>
                    t.status === 'completed' &&
                    t.result &&
                    (
                        t.title.toLowerCase().includes(initialName.toLowerCase()) ||
                        initialName.toLowerCase().includes(t.title.toLowerCase()) ||
                        keywords.some(k => t.title.toLowerCase().includes(k)) ||
                        t.type === 'article' // Fallback to article if it's the only one done
                    )
                );

                if (relatedTask?.result) {
                    setSocialContent(`Check out our latest ${relatedTask.type}: ${relatedTask.title}\n\n${relatedTask.result.substring(0, 500)}...`);
                }
            }
        }
    }, [profile, plan, taskId, initialName, socialContent]);

    const handleScheduleSocial = async () => {
        if (!socialContent) {
            toast.error("Please enter post content");
            return;
        }
        setLoading(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));
        setLoading(false);
        toast.success("Post scheduled successfully!");
        setSocialContent("");
        if (taskId) updateTaskStatus(taskId, 'completed');
    };

    const handleCreateGoogleAds = async () => {
        if (!googleCampaign.name || !googleCampaign.headline) {
            toast.error("Please fill in the required fields");
            return;
        }
        setLoading(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 2000));
        setLoading(false);
        toast.success("Google Ads campaign created!");
        if (taskId) updateTaskStatus(taskId, 'completed');
    };

    return (
        <div className="p-8">
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Campaign Management</h2>
                        <p className="text-muted-foreground">
                            Manage your social media and Google Ads campaigns
                        </p>
                    </div>
                    <div>
                        {taskId && (
                            <Button variant="outline" className="mr-2" onClick={() => router.push("/strategy")}>
                                Back to Strategy
                            </Button>
                        )}
                        <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            New Campaign
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="social" className="space-y-4">
                <TabsList className="bg-background border">
                    <TabsTrigger value="social">Social Media</TabsTrigger>
                    <TabsTrigger value="google">Google Ads</TabsTrigger>
                </TabsList>

                <TabsContent value="social" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Social Media Scheduler</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform</Label>
                                <select
                                    id="platform"
                                    className="w-full p-2 border rounded-md bg-transparent"
                                >
                                    <option>Facebook</option>
                                    <option>Instagram</option>
                                    <option>Twitter</option>
                                    <option>LinkedIn</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="post-content">Post Content</Label>
                                <Textarea
                                    id="post-content"
                                    placeholder="Write your post content..."
                                    className="min-h-[150px]"
                                    value={socialContent}
                                    onChange={(e) => setSocialContent(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schedule-date">Schedule Date</Label>
                                    <Input id="schedule-date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="schedule-time">Schedule Time</Label>
                                    <Input id="schedule-time" type="time" />
                                </div>
                            </div>
                            <Button onClick={handleScheduleSocial} disabled={loading} className="w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Calendar className="h-4 w-4 mr-2" />
                                )}
                                Schedule Post
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Scheduled Posts</h3>
                        {socialContent === "" && !loading ? (
                            <div className="text-center text-muted-foreground py-8">
                                No scheduled posts yet. Create your first campaign above.
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium">Recent Post Scheduled</p>
                                    <p className="text-sm text-muted-foreground">Queued for synchronization</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="google" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="font-semibold mb-4">Google Ads Campaign Builder</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">Campaign Name</Label>
                                <Input
                                    id="campaign-name"
                                    placeholder="e.g., Summer Sale 2024"
                                    value={googleCampaign.name}
                                    onChange={(e) => setGoogleCampaign({ ...googleCampaign, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ad-headline">Ad Headline</Label>
                                <Input
                                    id="ad-headline"
                                    placeholder="Compelling headline (max 30 characters)"
                                    maxLength={30}
                                    value={googleCampaign.headline}
                                    onChange={(e) => setGoogleCampaign({ ...googleCampaign, headline: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ad-description">Ad Description</Label>
                                <Textarea
                                    id="ad-description"
                                    placeholder="Describe your offer (max 90 characters)"
                                    maxLength={90}
                                    className="min-h-[100px]"
                                    value={googleCampaign.description}
                                    onChange={(e) => setGoogleCampaign({ ...googleCampaign, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Daily Budget ($)</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        placeholder="50"
                                        value={googleCampaign.budget}
                                        onChange={(e) => setGoogleCampaign({ ...googleCampaign, budget: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target-url">Target URL</Label>
                                    <Input
                                        id="target-url"
                                        type="url"
                                        placeholder="https://"
                                        value={googleCampaign.url}
                                        onChange={(e) => setGoogleCampaign({ ...googleCampaign, url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                                <Input
                                    id="keywords"
                                    placeholder="marketing, digital ads, business growth"
                                    value={googleCampaign.keywords}
                                    onChange={(e) => setGoogleCampaign({ ...googleCampaign, keywords: e.target.value })}
                                />
                            </div>
                            <Button onClick={handleCreateGoogleAds} disabled={loading} className="w-full">
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                )}
                                Create Campaign
                            </Button>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
