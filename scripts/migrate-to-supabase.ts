
// Load env vars
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import fetch, { Headers, Request, Response } from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Polyfill globals for Supabase in Node 18 environment
if (!global.fetch) {
    (global as any).fetch = fetch;
    (global as any).Headers = Headers;
    (global as any).Request = Request;
    (global as any).Response = Response;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STRATEGY_FILE = path.join(DATA_DIR, 'strategy.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

// Create local client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

async function migrate() {
    console.log("Starting migration to Supabase (with full polyfill)...");

    // 1. Read Local Data
    let strategyData = null;
    let contentData = [];

    if (fs.existsSync(STRATEGY_FILE)) {
        try {
            strategyData = JSON.parse(fs.readFileSync(STRATEGY_FILE, 'utf-8'));
        } catch (e) {
            console.error("Error reading strategy.json", e);
        }
    }
    if (fs.existsSync(CONTENT_FILE)) {
        try {
            contentData = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
        } catch (e) {
            console.error("Error reading content.json", e);
        }
    }

    if (!strategyData) {
        console.log("No strategy data found. Skipping strategy migration.");
    } else {
        // 2. Migrate Strategy
        console.log(`Migrating Strategy: ${strategyData.id}`);
        const { error: stratError } = await supabase.from('strategies').upsert({
            id: strategyData.id,
            created_at: strategyData.createdAt,
            brand_profile: strategyData.brandProfile,
            objectives: strategyData.objectives
        });
        if (stratError) console.error("Strategy Migration Error:", stratError);

        // 3. Migrate Phases & Tasks
        if (strategyData.phases) {
            for (const phase of strategyData.phases) {
                console.log(`Migrating Phase: ${phase.title}`);
                const { error: phaseError } = await supabase.from('phases').upsert({
                    id: phase.id,
                    strategy_id: strategyData.id,
                    title: phase.title,
                    order: 0
                });
                if (phaseError) console.error(`Phase Error (${phase.title}):`, phaseError);

                if (phase.tasks) {
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
                        if (taskError) console.error(`Task Error (${task.title}):`, taskError);
                    }
                }
            }
        }
    }

    // 4. Migrate Content
    if (!contentData || contentData.length === 0) {
        console.log("No content data found.");
    } else {
        console.log(`Migrating ${contentData.length} content items...`);
        for (const item of contentData) {
            const { error: contentError } = await supabase.from('content_items').upsert({
                id: item.id,
                task_id: item.taskId,
                type: item.type,
                title: item.title,
                content: item.content,
                status: item.status,
                created_at: item.createdAt,
                updated_at: item.updatedAt,
                metadata: item.metadata || {}
            });
            if (contentError) {
                console.error(`Content Error (${item.title}):`, contentError);
            }
        }
    }

    console.log("Migration Complete.");
}

migrate();
