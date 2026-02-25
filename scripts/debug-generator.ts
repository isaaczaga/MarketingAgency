
// scripts/debug-generator.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { ContentGenerator } from "../lib/generation/content-generator";
import { StrategyTask } from "../lib/types";

// Mock environment for the script
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "your-key-if-needed";

async function runDebug() {
    console.log("Starting Debug Run...");

    // 1. Test Article Generation (Fastest?)
    const articleTask: StrategyTask = {
        id: "debug-article-1",
        phase: "Debug Phase",
        type: "article",
        title: "The Future of AI Debugging",
        description: "A short article about how to debug AI agents.",
        status: "PLANNED"
    };

    try {
        await ContentGenerator.executeTask(articleTask, { title: "DebugBrand", description: "Testing", brandVoice: "Technical", targetAudience: "Developers", keywords: [] });
        console.log("Article Task: SUCCESS");
    } catch (e) {
        console.error("Article Task: FAILED", e);
    }

    // 2. Test Podcast Generation (Check script cleaning)
    const podcastTask: StrategyTask = {
        id: "debug-podcast-1",
        phase: "Debug Phase",
        type: "podcast",
        title: "Debugging Audio",
        description: "Discussing audio generation latencies.",
        status: "PLANNED"
    };

    try {
        await ContentGenerator.executeTask(podcastTask);
        console.log("Podcast Task: SUCCESS");
    } catch (e) {
        console.error("Podcast Task: FAILED", e);
    }
}

runDebug();
