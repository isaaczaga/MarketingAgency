"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DigitalStrategy, ContentItem, StrategyTask, ContentStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Clock, FileText, Loader2, PlayCircle, RefreshCw, XCircle, Rocket } from 'lucide-react';
import { toast } from 'sonner';

export default function AutonomousDashboard() {
    const [strategy, setStrategy] = useState<DigitalStrategy | null>(null);
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<StrategyTask | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRunningAutoPilot, setIsRunningAutoPilot] = useState(false);
    const [editingContent, setEditingContent] = useState<string>("");
    const [isCheckingVideo, setIsCheckingVideo] = useState(false);

    useEffect(() => {
        fetchState();
    }, []);

    const fetchState = async () => {
        try {
            const res = await axios.get('/api/autonomous/state');
            setStrategy(res.data.strategy);
            setContentItems(res.data.content || []);
        } catch (error) {
            console.error("Failed to load state", error);
            toast.error("Failed to load dashboard state");
        } finally {
            setLoading(false);
        }
    };

    const handleRunAutoPilot = async () => {
        setIsRunningAutoPilot(true);
        toast.info("Running Auto-Pilot...");
        try {
            const res = await axios.post('/api/autonomous/run');
            if (res.data.success) {
                toast.success(`Auto-Pilot finished. Published ${res.data.publishedCount} items.`);
                await fetchState();
            } else {
                toast.error("Auto-Pilot completed with errors.");
            }
        } catch (error) {
            console.error("Auto-Pilot failed", error);
            toast.error("Failed to run Auto-Pilot");
        } finally {
            setIsRunningAutoPilot(false);
        }
    };

    const handleGenerate = async (task: StrategyTask) => {
        setIsGenerating(true);
        toast.info(`Generating content for ${task.title}...`);
        try {
            const res = await axios.post('/api/tasks/execute', {
                task: task,
                brandContext: strategy?.brandProfile,
                previousResults: []
            });

            if (res.data.success) {
                toast.success("Content generated successfully!");
                await fetchState();
            }
        } catch (error) {
            console.error("Generation failed", error);
            toast.error("Failed to generate content");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenTask = (task: StrategyTask) => {
        setSelectedTask(task);
        const content = contentItems.find(c => c.id === task.contentId);
        if (content) {
            setEditingContent(typeof content.content === 'string' ? content.content : JSON.stringify(content.content, null, 2));
        } else {
            setEditingContent("");
        }
    };

    const handleSaveContent = async () => {
        if (!selectedTask || !selectedTask.contentId) return;

        try {
            await axios.put(`/api/autonomous/content/${selectedTask.contentId}`, {
                content: editingContent
            });
            toast.success("Content saved!");
            fetchState();
        } catch (error) {
            toast.error("Failed to save content");
        }
    };

    const handleApprove = async () => {
        if (!selectedTask || !selectedTask.contentId) return;
        try {
            await axios.put(`/api/autonomous/content/${selectedTask.contentId}`, {
                status: 'APPROVED'
            });
            toast.success("Content approved!");
            setSelectedTask(null);
            fetchState();
        } catch (error) {
            toast.error("Failed to approve content");
        }
    };

    const handlePublishDirect = async () => {
        if (!selectedTask || !selectedTask.contentId) return;

        const contentItem = contentItems.find(c => c.id === selectedTask.contentId);
        if (!contentItem || contentItem.type !== 'ad') {
            toast.error("Can only directly publish Ad tasks.");
            return;
        }

        toast.info("Publishing Ad Campaign...");
        try {
            const res = await axios.post('/api/autonomous/publish', {
                contentId: selectedTask.contentId
            });

            if (res.data.success) {
                toast.success("Ad published to Google Ads successfully!");
                setSelectedTask(null);
                fetchState();
            } else {
                toast.error(`Publishing Failed: ${res.data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            toast.error(`Publishing Failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const handlePublishToMetaDirect = async () => {
        if (!selectedTask || !selectedTask.contentId) return;

        const contentItem = contentItems.find(c => c.id === selectedTask.contentId);
        if (!contentItem || contentItem.type !== 'article') {
            toast.error("Manual direct publishing to Meta currently supports Articles.");
            return;
        }

        toast.info("Publishing to Facebook & Instagram...");
        try {
            const res = await axios.post('/api/autonomous/publish/meta', {
                contentId: selectedTask.contentId
            });

            if (res.data.success) {
                toast.success("Content published to Meta successfully!");
                setSelectedTask(null);
                fetchState();
            } else {
                toast.error(`Publishing Failed: ${res.data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            toast.error(`Publishing Failed: ${error.response?.data?.error || error.message}`);
        }
    };

    const handleCheckVideoStatus = async () => {
        if (!selectedTask || !editingContent.includes('videoId')) return;

        try {
            setIsCheckingVideo(true);
            const contentData = JSON.parse(editingContent);

            const res = await axios.get(`/api/video/heygen?videoId=${contentData.videoId}`);

            if (res.data.status === 'completed' && res.data.videoUrl) {
                toast.success("Video is ready!");
                const updatedContent = JSON.stringify({
                    ...contentData,
                    status: 'completed',
                    videoUrl: res.data.videoUrl,
                    thumbnailUrl: res.data.thumbnail
                }, null, 2);

                setEditingContent(updatedContent);

                // Auto-save the new content state
                await axios.put(`/api/autonomous/content/${selectedTask.contentId}`, {
                    content: updatedContent
                });
                fetchState();
            } else if (res.data.status === 'processing' || res.data.status === 'pending') {
                toast.info("Video is still rendering. Check back in a minute.");
            } else {
                toast.error(`Video status: ${res.data.status}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to check video status");
        } finally {
            setIsCheckingVideo(false);
        }
    };

    const handleRenderVideo = async () => {
        if (!selectedTask || !editingContent.includes('heygen')) return;

        try {
            setIsGenerating(true);
            const contentData = JSON.parse(editingContent);

            toast.info("Sending script to HeyGen...");
            const res = await axios.post('/api/video/heygen', {
                script: contentData.script
            });

            if (res.data.videoId) {
                toast.success("Script sent! Video is rendering.");
                const updatedContent = JSON.stringify({
                    status: 'processing',
                    type: 'heygen',
                    videoId: res.data.videoId,
                    script: contentData.script
                }, null, 2);

                setEditingContent(updatedContent);

                // Auto-save the new content state
                await axios.put(`/api/autonomous/content/${selectedTask.contentId}`, {
                    content: updatedContent
                });
                fetchState();
            } else {
                toast.error(`Rendering Failed: ${res.data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Rendering Failed: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReject = async () => {
        if (!selectedTask || !selectedTask.contentId) return;
        try {
            await axios.put(`/api/autonomous/content/${selectedTask.contentId}`, {
                status: 'DRAFT',
                feedback: "Rejected by user"
            });
            toast.info("Content rejected. Status set to Draft.");
            fetchState();
        } catch (error) {
            toast.error("Failed to reject content");
        }
    };

    const getStatusIcon = (status: ContentStatus) => {
        switch (status) {
            case 'APPROVED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'PENDING_APPROVAL': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'DRAFT': return <FileText className="w-4 h-4 text-gray-500" />;
            case 'PUBLISHED': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            default: return <Circle className="w-4 h-4 text-gray-300" />;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

    if (!strategy) {
        return (
            <div className="container mx-auto p-6 space-y-8">
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <h3 className="text-lg font-medium mb-2">No Strategy Found</h3>
                        <p className="text-muted-foreground mb-4">Generate a strategy to get started.</p>
                        <Button onClick={() => window.location.href = '/content/seo'}>Go to Strategy Builder</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Autonomous Agency</h1>
                    <p className="text-muted-foreground">Manage your strategy, review content, and auto-publish.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleRunAutoPilot} variant="secondary" size="sm" disabled={isRunningAutoPilot}>
                        {isRunningAutoPilot ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                        Run Auto-Pilot
                    </Button>
                    <Button onClick={fetchState} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {strategy.phases.map((phase) => (
                    <Card key={phase.id}>
                        <CardHeader>
                            <CardTitle>{phase.title}</CardTitle>
                            <CardDescription>{phase.tasks.length} tasks scheduled</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {phase.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {getStatusIcon(task.status)}
                                            <div>
                                                <h4 className="font-medium cursor-pointer hover:underline" onClick={() => handleOpenTask(task)}>{task.title}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-xs">{task.type}</Badge>
                                                    <span className="text-xs text-muted-foreground">{task.scheduledDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.status === 'PLANNED' ? (
                                                <Button size="sm" onClick={() => handleGenerate(task)} disabled={isGenerating}>
                                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                                                    Auto-Create
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleOpenTask(task)}>
                                                    {'Review'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={!!selectedTask} onOpenChange={(open: boolean) => !open && setSelectedTask(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{selectedTask?.title}</DialogTitle>
                        <DialogDescription>{selectedTask?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 border rounded-md p-4 bg-slate-50 flex flex-col gap-4">
                        {selectedTask?.type === 'video' && editingContent.includes('heygen') ? (
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded border">
                                {(() => {
                                    try {
                                        const data = JSON.parse(editingContent);
                                        if (data.status === 'pending_render') {
                                            return (
                                                <div className="w-full max-w-lg space-y-4 text-center py-8">
                                                    <h3 className="font-semibold text-lg hover:text-purple-600 transition-colors">AI Avatar Video Script Ready</h3>
                                                    <div className="text-sm bg-gray-50 p-6 rounded text-left border border-slate-200">
                                                        <strong className="text-slate-500 uppercase tracking-widest text-xs">Spoken Script:</strong> <br /><br />
                                                        <span className="leading-relaxed">{data.script}</span>
                                                    </div>
                                                    <Button onClick={handleRenderVideo} disabled={isGenerating} className="w-full bg-purple-600 hover:bg-purple-700 mt-4 text-white shadow-md">
                                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                                                        Render Avatar Video (HeyGen)
                                                    </Button>
                                                </div>
                                            );
                                        } else if (data.videoUrl) {
                                            return (
                                                <div className="w-full max-w-lg space-y-4">
                                                    <video src={data.videoUrl} controls poster={data.thumbnailUrl} className="w-full rounded-md shadow" />
                                                    <div className="text-sm bg-gray-100 p-3 rounded">
                                                        <strong>Script:</strong> <br /> {data.script}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="text-center py-12 space-y-4">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                                                    </div>
                                                    <h3 className="font-semibold text-lg">AI Avatar Video is Rendering...</h3>
                                                    <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                                                        HeyGen takes about 2-3 minutes to render the avatar speaking your script. Check back shortly.
                                                    </p>
                                                    <Button onClick={handleCheckVideoStatus} disabled={isCheckingVideo} variant="outline">
                                                        {isCheckingVideo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                                        Check Readiness Status
                                                    </Button>
                                                    <div className="text-xs text-left bg-gray-100 p-2 rounded mt-6 w-full max-w-md overflow-auto">
                                                        <pre>{editingContent}</pre>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    } catch (e) { return null; }
                                })()}
                            </div>
                        ) : (
                            <textarea
                                className="w-full h-full bg-transparent border-none resize-none focus:outline-none font-mono text-sm"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                placeholder="Generated content will appear here..."
                            />
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        {selectedTask && selectedTask.status !== 'PLANNED' && (
                            <>
                                <Button variant="outline" onClick={handleSaveContent}>Save Draft</Button>
                                <Button variant="destructive" onClick={handleReject}>Reject</Button>
                                {selectedTask.status === 'APPROVED' && selectedTask.type === 'ad' ? (
                                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePublishDirect}>
                                        <Rocket className="w-4 h-4 mr-2" />
                                        Publish to Google Ads
                                    </Button>
                                ) : selectedTask.status === 'APPROVED' && selectedTask.type === 'article' ? (
                                    <Button className="bg-fuchsia-600 hover:bg-fuchsia-700" onClick={handlePublishToMetaDirect}>
                                        <Rocket className="w-4 h-4 mr-2" />
                                        Publish to Meta (FB & IG)
                                    </Button>
                                ) : (
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove}>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Approve & Ready
                                    </Button>
                                )}
                            </>
                        )}
                        {selectedTask?.status === 'PLANNED' && (
                            <Button onClick={() => { if (selectedTask) handleGenerate(selectedTask) }} disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Content Now"}
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => setSelectedTask(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
