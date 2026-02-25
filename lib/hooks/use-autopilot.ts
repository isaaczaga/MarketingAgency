"use client";

import { useState, useCallback, useEffect } from "react";
import { useMarketingPlan, MarketingTask } from "./use-marketing-plan";
import { useBrandProfile } from "./use-brand-profile";
import { toast } from "sonner";

export function useAutopilot() {
    const { plan, updateTaskStatus } = useMarketingPlan();
    const { profile } = useBrandProfile();
    const [isActive, setIsActive] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    const executeNextTask = useCallback(async () => {
        if (!plan || !isActive || isExecuting) return;

        // Find the first pending task
        const allTasks: MarketingTask[] = plan.strategy.phases.flatMap(p => p.tasks);
        const nextTask = allTasks.find(t => t.status === 'PLANNED');

        if (!nextTask) {
            setIsActive(false);
            toast.success("Auto-Pilot completed! All tasks are finished.");
            return;
        }

        setIsExecuting(true);
        setCurrentTaskId(nextTask.id);

        // Gather context from all completed tasks for consistency
        const previousResults = allTasks
            .filter(t => t.status === 'completed' && t.result)
            .map(t => ({
                id: t.id,
                type: t.type,
                title: t.title,
                result: t.result?.substring(0, 2000) // Truncate to avoid huge prompts
            }));

        try {
            console.log(`Auto-Pilot: Executing task "${nextTask.title}" (${nextTask.type})...`);

            const response = await fetch("/api/tasks/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    task: nextTask,
                    brandContext: profile,
                    previousResults
                }),
            });

            if (!response.ok) throw new Error(`Failed to execute task ${nextTask.id}`);

            const data = await response.json();
            const result = data.content || data.seoStrategy || JSON.stringify(data.adCopy || data.script);

            updateTaskStatus(nextTask.id, 'completed', result);
            toast.info(`Task "${nextTask.title}" completed autonomously.`);

        } catch (error: any) {
            console.error("Auto-Pilot execution error:", error);
            toast.error(`Auto-Pilot failed on task: ${nextTask.title}`);
            setIsActive(false); // Stop on error
        } finally {
            setIsExecuting(false);
            setCurrentTaskId(null);
        }
    }, [plan, isActive, isExecuting, profile, updateTaskStatus]);

    // Loop effect
    useEffect(() => {
        if (isActive && !isExecuting) {
            const timer = setTimeout(() => {
                executeNextTask();
            }, 1000); // Small delay between tasks
            return () => clearTimeout(timer);
        }
    }, [isActive, isExecuting, executeNextTask]);

    return {
        isActive,
        setIsActive,
        isExecuting,
        currentTaskId,
        toggleAutopilot: () => setIsActive(!isActive)
    };
}
