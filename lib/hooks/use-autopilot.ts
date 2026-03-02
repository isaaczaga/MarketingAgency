"use client";

import { useState, useCallback, useEffect } from "react";
import { useBrandProfile } from "./use-brand-profile";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DigitalStrategy, StrategyTask } from "@/lib/types";

export function useAutopilot(strategy?: DigitalStrategy | null, onRefresh?: () => void) {
    const { profile } = useBrandProfile();
    const [isActive, setIsActive] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    const executeNextTask = useCallback(async () => {
        if (!strategy || !isActive || isExecuting) return;

        // Find the first pending task
        const allTasks: StrategyTask[] = strategy.phases?.flatMap(p => p.tasks) || [];
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
            .filter(t => t.status !== 'PLANNED' && t.contentId) // Usually completed tasks have contentId
            .map(t => ({
                id: t.id,
                type: t.type,
                title: t.title,
            })); // We shouldn't send massive full content strings. Truncated on backend?

        try {
            console.log(`Auto-Pilot: Executing task "${nextTask.title}" (${nextTask.type})...`);

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                throw new Error("You must be logged in to execute tasks automatically.");
            }

            const response = await fetch("/api/tasks/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    task: nextTask,
                    brandContext: profile,
                    previousResults
                }),
            });

            if (!response.ok) throw new Error(`Failed to execute task ${nextTask.id}`);

            toast.info(`Task "${nextTask.title}" completed autonomously.`);
            if (onRefresh) onRefresh();

        } catch (error: any) {
            console.error("Auto-Pilot execution error:", error);
            toast.error(`Auto-Pilot failed on task: ${nextTask.title}`);
            setIsActive(false); // Stop on error
        } finally {
            setIsExecuting(false);
            setCurrentTaskId(null);
        }
    }, [strategy, isActive, isExecuting, profile, onRefresh]);

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
