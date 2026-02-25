"use client";

import { useAutopilot } from "@/lib/hooks/use-autopilot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Pause, Eye, CheckCircle2, Circle, Rocket, FileText, Video, Mic, TrendingUp, ChevronRight, Search } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Suspense, useEffect, useRef, useState } from "react";
import axios from "axios";
import { DigitalStrategy, ContentItem, StrategyTask } from '@/lib/types';

function StrategyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isActive, currentTaskId, toggleAutopilot } = useAutopilot();
    const [strategy, setStrategy] = useState<DigitalStrategy | null>(null);
    const [contentItems, setContentItems] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingTask, setViewingTask] = useState<StrategyTask | null>(null);
    const hasAutoStarted = useRef(false);

    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await axios.get('/api/autonomous/state');
                setStrategy(res.data.strategy);
                setContentItems(res.data.content || []);
            } catch (error) {
                console.error("Failed to load state", error);
            } finally {
                setLoading(false);
            }
        };
        fetchState();
    }, []);

    useEffect(() => {
        const autoStart = searchParams.get("autoStart") === "true";
        if (autoStart && !isActive && !hasAutoStarted.current && strategy) {
            hasAutoStarted.current = true;
            toggleAutopilot();
            toast.info("Auto-Pilot sequence started automatically!");
        }
    }, [searchParams, isActive, toggleAutopilot, strategy]);

    if (loading) {
        return <div className="p-8 text-center py-20 animate-pulse">Loading Strategy Board...</div>;
    }

    if (!strategy) {
        return (
            <div className="p-8 text-center py-20">
                <div className="max-w-md mx-auto space-y-6">
                    <Rocket className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                    <h2 className="text-2xl font-bold">No Active Strategy</h2>
                    <p className="text-muted-foreground">
                        You haven&apos;t generated a master plan yet. Head over to Brand Analysis to get started.
                    </p>
                    <Button onClick={() => router.push("/analysis")}>
                        Analyze a Brand
                    </Button>
                </div>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'article': return <FileText className="h-4 w-4" />;
            case 'video': return <Video className="h-4 w-4" />;
            case 'podcast': return <Mic className="h-4 w-4" />;
            case 'ad': return <TrendingUp className="h-4 w-4" />;
            case 'keyword': return <Search className="h-4 w-4" />;
            default: return <Circle className="h-4 w-4" />;
        }
    };

    const handleExecuteTask = (task: StrategyTask) => {
        if (task.status !== 'PLANNED') {
            setViewingTask(task);
            return;
        }

        if (isActive) {
            toast.error("Manual execution disabled while Auto-Pilot is active");
            return;
        }

        // Redirect to the appropriate tool page with pre-filled context
        const query = new URLSearchParams({
            taskId: task.id,
            topic: task.title,
            description: task.description
        }).toString();

        switch (task.type) {
            case 'article': router.push(`/content/articles?${query}`); break;
            case 'video': router.push(`/content/video?${query}`); break;
            case 'podcast': router.push(`/content/podcast?${query}`); break;
            case 'ad': router.push(`/campaigns?${query}`); break;
            case 'keyword':
                router.push(`/content/seo?${query}`);
                break;
            default:
                toast.error(`Task type "${task.type}" not implemented yet`);
        }
    };

    const completedTasks = strategy.phases?.flatMap(p => p.tasks)?.filter(t => t.status !== 'PLANNED')?.length || 0;
    const totalTasks = strategy.phases?.flatMap(p => p.tasks)?.length || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Attempt to locate the exact content record
    let viewingContent = viewingTask && contentItems ? contentItems.find(c => c.id === viewingTask.contentId) : null;

    // In case there is no explicit contentId but it matches by Task ID (earlier implementation)
    if (viewingTask && !viewingContent) {
        viewingContent = contentItems.find(c => c.taskId === viewingTask.id) || null;
    }

    const resultText = viewingContent ? (typeof viewingContent.content === 'string' ? viewingContent.content : JSON.stringify(viewingContent.content, null, 2)) : "No content generated yet.";

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-10 flex justify-between items-end">
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">Strategy Board</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {strategy.brandProfile.title}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Plan generated on {new Date(strategy.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <Button
                            variant={isActive ? "destructive" : "default"}
                            size="sm"
                            className="rounded-full px-4 gap-2 transition-all hover:scale-105"
                            onClick={toggleAutopilot}
                        >
                            {isActive ? (
                                <>
                                    <Pause className="h-4 w-4" />
                                    Stop Auto-Pilot
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Start Auto-Pilot
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium mb-2">Total Progress</p>
                    <div className="w-64 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{progress}% Complete ({completedTasks}/{totalTasks} tasks)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {strategy.phases?.map((phase, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs">
                                {phase.title}
                            </h3>
                        </div>

                        {phase.tasks?.map((task) => (
                            <Card
                                key={task.id}
                                className={cn(
                                    "p-4 border-l-4 transition-all hover:shadow-md",
                                    task.status !== 'PLANNED'
                                        ? "border-l-green-500 bg-green-50/10"
                                        : "border-l-blue-500"
                                )}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className={cn(
                                            "p-2 rounded-lg relative",
                                            task.status !== 'PLANNED' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700",
                                            currentTaskId === task.id && "animate-pulse ring-2 ring-blue-500 ring-offset-2"
                                        )}>
                                            {getIcon(task.type)}
                                            {currentTaskId === task.id && (
                                                <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-0.5 animate-spin">
                                                    <Loader2 className="h-2 w-2 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        {task.status !== 'PLANNED' && (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {task.description}
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "w-full text-xs h-8 transition-all",
                                            task.status !== 'PLANNED' && "border-green-200 hover:bg-green-50 text-green-700"
                                        )}
                                        onClick={() => handleExecuteTask(task)}
                                        disabled={isActive && task.status === 'PLANNED'}
                                    >
                                        {task.status !== 'PLANNED' ? (
                                            <>
                                                <Eye className="h-3 w-3 mr-1" />
                                                {task.status === 'PUBLISHED' ? "View Published" : "View Result"}
                                            </>
                                        ) : (
                                            <>
                                                {currentTaskId === task.id ? "Executing..." : "Run Task"}
                                                <ChevronRight className="h-3 w-3 ml-1" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-12 p-8 bg-gray-900 rounded-3xl text-white relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h3 className="text-2xl font-bold mb-4">Strategic Objectives</h3>
                    <ul className="space-y-3">
                        {strategy.objectives?.map((obj, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span className="text-sm">{obj}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
            </div>

            <Dialog open={!!viewingTask} onOpenChange={(open: boolean) => !open && setViewingTask(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{viewingTask?.title}</DialogTitle>
                        <DialogDescription>{viewingTask?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-xs overflow-auto max-h-96">
                        {resultText}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-xs text-muted-foreground mr-auto flex gap-2 items-center">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Status: {viewingTask?.status || 'Unknown'}
                        </span>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setViewingTask(null)}>Close</Button>
                            {resultText !== "No content generated yet." && (
                                <Button onClick={() => {
                                    navigator.clipboard.writeText(resultText);
                                    toast.success("Copied to clipboard");
                                }}>
                                    Copy Result
                                </Button>
                            )}
                            <Button variant="secondary" onClick={() => { router.push('/autonomous/dashboard'); }}>
                                Open in Dashboard
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function StrategyPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading Strategy Board...</div>}>
            <StrategyContent />
        </Suspense>
    );
}
