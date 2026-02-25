"use client";

import { useState, useEffect } from "react";
import { BrandProfile } from "./use-brand-profile";

export interface MarketingTask {
    id: string;
    type: 'article' | 'video' | 'podcast' | 'ad' | 'keyword';
    title: string;
    description: string;
    status: 'PLANNED' | 'completed';
    result?: string;
}

export interface MarketingPhase {
    title: string;
    tasks: MarketingTask[];
}

export interface MarketingPlan {
    id: string;
    url: string;
    brandProfile: BrandProfile;
    strategy: {
        objectives: string[];
        phases: MarketingPhase[];
    };
    createdAt: string;
}

export function useMarketingPlan() {
    const [plan, setPlan] = useState<MarketingPlan | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("marketing_plan");
        if (saved) {
            try {
                setPlan(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse marketing plan", e);
            }
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "marketing_plan" && e.newValue) {
                try {
                    setPlan(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Failed to sync marketing plan", err);
                }
            } else if (e.key === "marketing_plan" && !e.newValue) {
                setPlan(null);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const savePlan = (newPlan: MarketingPlan) => {
        localStorage.setItem("marketing_plan", JSON.stringify(newPlan));
        setPlan(newPlan);
    };

    const updateTaskStatus = (taskId: string, status: 'PLANNED' | 'completed', result?: string) => {
        if (!plan) return;

        const newPhases = plan.strategy.phases.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(task =>
                task.id === taskId ? { ...task, status, result: result || task.result } : task
            )
        }));

        const newPlan = {
            ...plan,
            strategy: {
                ...plan.strategy,
                phases: newPhases
            }
        };

        savePlan(newPlan);
    };

    const clearPlan = () => {
        localStorage.removeItem("marketing_plan");
        setPlan(null);
    };

    return { plan, savePlan, updateTaskStatus, clearPlan };
}
