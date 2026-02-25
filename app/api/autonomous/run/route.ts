import { NextRequest, NextResponse } from "next/server";
import { ContentStore, StrategyStore } from "@/lib/store";
import { GoogleAdsService } from "@/lib/publishing/google-ads";
import { SocialMediaService } from "@/lib/publishing/social-media";
import { ContentGenerator } from "@/lib/generation/content-generator";
import { StrategyTask } from "@/lib/types";
import { verifyServerAuth } from "@/lib/auth-server";

export const runtime = 'nodejs';

/**
 * RELIABLE CRON JOB / MASTER LOOP
 * 1. Checks Strategy for Pending Tasks -> Generates Content
 * 2. Checks Content for Pending Approval -> Auto-Approves (if enabled) -> Publishes
 */
export async function POST(request: NextRequest) {
    try {
        const user = await verifyServerAuth(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const results = [];
        const errors = [];
        const strategy = await StrategyStore.get();

        if (!strategy) {
            return NextResponse.json({ error: "No strategy found" }, { status: 404 });
        }

        // PHASE 1: GENERATE CONTENT FOR PENDING TASKS
        let generatedCount = 0;
        const tasks = strategy.phases.flatMap(p => p.tasks).filter(t => t.status === 'PLANNED');

        // Limit to 3 tasks per run (parallelized)
        const tasksToExecute = tasks.slice(0, 3);
        console.log(`[Auto-Pilot] Starting generation for ${tasksToExecute.length} tasks...`);

        await Promise.all(tasksToExecute.map(async (task) => {
            try {
                console.log(`[Auto-Pilot] Generating content for task: ${task.title}`);
                const { contentId, contentItem } = await ContentGenerator.executeTask(task, strategy.brandProfile);

                // Save to store immediately
                await ContentStore.save(contentItem);

                // For "Total Automation", we instantly mark as APPROVED
                await ContentStore.updateStatus(contentId, 'APPROVED');

                // Update Task Status
                const phase = strategy.phases.find(p => p.tasks.find(t => t.id === task.id));
                const targetTask = phase?.tasks.find(t => t.id === task.id);
                if (targetTask) {
                    targetTask.status = 'APPROVED';
                    targetTask.contentId = contentId;
                }
                generatedCount++;
                results.push({ id: task.id, type: 'GENERATION', status: 'APPROVED' });
            } catch (e: any) {
                console.error(`[Auto-Pilot] Failed to generate ${task.id}`, e);
                errors.push({ id: task.id, step: 'GENERATION', error: e.message });
            }
        }));

        if (generatedCount > 0) {
            await StrategyStore.save(strategy);
        }

        // PHASE 2: PUBLISH APPROVED CONTENT
        const approvedContent = await ContentStore.getByStatus('APPROVED');
        let publishedCount = 0;

        for (const content of approvedContent) {
            try {
                console.log(`[Auto-Pilot] Publishing content: ${content.title}`);
                let publishResult;

                if (content.type === 'ad' || content.title.toLowerCase().includes('ad')) {
                    publishResult = await GoogleAdsService.publish(content);
                } else if (content.type === 'video') {
                    publishResult = await SocialMediaService.publishToInstagram(content); // Reels
                } else {
                    publishResult = await SocialMediaService.publishToLinkedIn(content);
                }

                if (publishResult.success) {
                    await ContentStore.updateStatus(content.id, 'PUBLISHED');
                    results.push({ id: content.id, type: 'PUBLISHING', status: 'PUBLISHED', platform: publishResult.platform });
                    publishedCount++;
                }
            } catch (error: any) {
                console.error(`[Auto-Pilot] Failed to publish ${content.id}`, error);
                errors.push({ id: content.id, step: 'PUBLISHING', error: error.message });
            }
        }

        return NextResponse.json({
            success: true,
            generatedCount,
            publishedCount,
            results,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
