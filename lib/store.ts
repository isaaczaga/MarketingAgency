import { supabase } from '@/lib/supabase';
import { DigitalStrategy, ContentItem, ContentStatus } from './types';

// Strategy Store
export const StrategyStore = {
    save: async (strategy: DigitalStrategy) => {
        // 1. Save Strategy
        const { error: stratError } = await supabase.from('strategies').upsert({
            id: strategy.id,
            created_at: strategy.createdAt,
            brand_profile: strategy.brandProfile,
            objectives: strategy.objectives
        });
        if (stratError) throw new Error(`Failed to save strategy: ${stratError.message}`);

        // 2. Save Phases & Tasks
        for (const phase of strategy.phases) {
            const { error: phaseError } = await supabase.from('phases').upsert({
                id: phase.id,
                strategy_id: strategy.id,
                title: phase.title,
                order: 0
            });
            if (phaseError) console.error(`Failed to save phase ${phase.id}:`, phaseError);

            for (const task of phase.tasks) {
                const { error: taskError } = await supabase.from('tasks').upsert({
                    id: task.id,
                    phase_id: phase.id,
                    type: task.type,
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    scheduled_date: task.scheduledDate,
                    content_id: task.contentId || null
                });
                if (taskError) console.error(`Failed to save task ${task.id}:`, taskError);
            }
        }
    },

    get: async (): Promise<DigitalStrategy | null> => {
        // Fetch Strategy with nested Phases and Tasks
        const { data: strategyData, error: stratError } = await supabase
            .from('strategies')
            .select('*')
            .single();

        if (stratError || !strategyData) return null;

        const { data: phasesData, error: phasesError } = await supabase
            .from('phases')
            .select(`
                *,
                tasks (*)
            `)
            .eq('strategy_id', strategyData.id);

        if (phasesError) {
            console.error("Error fetching phases:", phasesError);
            return null;
        }

        // Map back to DigitalStrategy interface
        const phases = (phasesData || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            tasks: (p.tasks || []).map((t: any) => ({
                id: t.id,
                phase: p.title, // Reconstruct phase title
                type: t.type,
                title: t.title,
                description: t.description,
                status: t.status,
                scheduledDate: t.scheduled_date,
                contentId: t.content_id
            }))
        }));

        return {
            id: strategyData.id,
            createdAt: strategyData.created_at,
            brandProfile: strategyData.brand_profile,
            objectives: strategyData.objectives,
            phases: phases
        };
    }
};

// Content Store
export const ContentStore = {
    getAll: async (): Promise<ContentItem[]> => {
        const { data, error } = await supabase
            .from('content_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching content:", error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            taskId: item.task_id,
            type: item.type,
            title: item.title,
            content: item.content,
            status: item.status,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            metadata: item.metadata
        }));
    },

    getById: async (id: string): Promise<ContentItem | undefined> => {
        const { data, error } = await supabase
            .from('content_items')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            taskId: data.task_id,
            type: data.type,
            title: data.title,
            content: data.content,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            metadata: data.metadata
        };
    },

    save: async (item: ContentItem) => {
        const { error } = await supabase.from('content_items').upsert({
            id: item.id,
            task_id: item.taskId,
            type: item.type,
            title: item.title,
            content: item.content, // Text or JSON string
            status: item.status,
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            metadata: item.metadata || {}
        });

        if (error) {
            console.error(`Failed to save content item ${item.id}:`, error);
            throw error;
        }
    },

    updateStatus: async (id: string, status: ContentStatus) => {
        const { error } = await supabase
            .from('content_items')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error(`Failed to update status for ${id}:`, error);
        }
    },

    getByStatus: async (status: ContentStatus): Promise<ContentItem[]> => {
        const { data, error } = await supabase
            .from('content_items')
            .select('*')
            .eq('status', status);

        if (error) {
            console.error("Error fetching content by status:", error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            taskId: item.task_id,
            type: item.type,
            title: item.title,
            content: item.content,
            status: item.status,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            metadata: item.metadata
        }));
    }
};
