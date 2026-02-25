import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini, BrandContext } from "@/lib/gemini";
import { generateVeoVideo } from "@/lib/veo";
import { generateNanoImages } from "@/lib/nano";
import { generatePodcastScript } from "@/lib/podcast";
import { ContentStore, StrategyStore } from "@/lib/store";
import { ContentItem, ContentStatus, DigitalStrategy } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { task, brandContext, previousResults } = await request.json();

        if (!task || !task.type) {
            return NextResponse.json({ error: "Task and task type are required" }, { status: 400 });
        }

        let result: any = "";
        let finalResult: string = "";

        // Format previous results for context
        const contextFromPrevious = previousResults && previousResults.length > 0
            ? `\n\nContext from previously generated content:\n${previousResults.map((r: any) => `Type: ${r.type}\nTitle: ${r.title}\nContent: ${r.result}\n---`).join("\n")}`
            : "";

        switch (task.type) {
            case 'article':
                const articlePrompt = `Write a professional blog article about "${task.title}".
Description: ${task.description}
Context: ${contextFromPrevious}
Brand Context: ${brandContext ? JSON.stringify(brandContext) : ''}
Include relevant industry terms and SEO-optimized headers.
The article should be around 800-1000 words in HTML format (use <h1>, <h2>, <p> tags).`;
                finalResult = await generateWithGemini(articlePrompt, brandContext);
                break;

            case 'video':
                // For Video tasks, generate a spoken script first
                const videoScript = await generateWithGemini(`Generate a spoken script (about 30 seconds long) for an AI Avatar video about "${task.title}". 
                Description: ${task.description}. 
                Output ONLY the spoken text, no directions or formatting.`, brandContext);

                console.log("Drafted Avatar Video script. Awaiting manual trigger to render with HeyGen:", videoScript.substring(0, 50) + "...");

                finalResult = JSON.stringify({
                    status: "pending_render",
                    type: "heygen",
                    script: videoScript
                });
                break;

            case 'podcast':
                // Generate Script
                const script = await generatePodcastScript(task.title, 5, brandContext);
                // We store the script. Audio generation happens on client or separate step to avoid timeout/storage issues
                finalResult = JSON.stringify({
                    type: "podcast_script",
                    script: script
                });
                break;

            case 'image':
            case 'ad': // Ads often need an image
                // Generate Ad Copy first
                const adCopy = await generateWithGemini(`Create 3 variations of ad copy for "${task.title}". ${task.description}. Format as JSON list.`, brandContext);

                // Generate Image
                let images: string[] = [];
                try {
                    images = await generateNanoImages(`Professional marketing photo for ${task.title}, high quality, 4k`, 1);
                } catch (e) {
                    console.error("Image Gen Error:", e);
                }

                finalResult = JSON.stringify({
                    adCopy: adCopy,
                    images: images // Base64
                });
                break;

            case 'keyword':
                const seoPrompt = `Perform keyword research and SEO strategy for "${task.title}".
Description: ${task.description}
Provide a JSON object with:
- focusKeywords (list of {keyword, volume, difficulty, intent})
- contentPillars (list of {title, description})
- onPageRecommendations (list)
- backlinkStrategy (string)`;
                const seoResult = await generateWithGemini(seoPrompt, brandContext);

                if (seoResult.includes('{')) {
                    try {
                        const jsonString = seoResult.replace(/```json\n?|\n?```/g, "").trim();
                        finalResult = JSON.stringify(JSON.parse(jsonString), null, 2);
                    } catch (e) {
                        finalResult = seoResult;
                    }
                } else {
                    finalResult = seoResult;
                }
                break;

            default:
                return NextResponse.json({ error: "Unsupported task type" }, { status: 400 });
        }

        // Create Content Item
        const contentId = uuidv4();
        const contentItem: ContentItem = {
            id: contentId,
            taskId: task.id,
            type: task.type,
            title: task.title,
            content: finalResult,
            status: 'PENDING_APPROVAL',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Save Content
        await ContentStore.save(contentItem);

        // Auto-Publish Integration
        let finalStatus: ContentStatus = 'PENDING_APPROVAL';

        if (task.type === 'ad') {
            try {
                console.log(`[Auto-Pilot] Auto-publishing Ad Campaign: ${task.title}`);
                const { GoogleAdsService } = await import("@/lib/publishing/google-ads");
                const publishResult = await GoogleAdsService.publish(contentItem);

                if (publishResult.success) {
                    finalStatus = 'PUBLISHED';
                    contentItem.status = finalStatus;
                    await ContentStore.updateStatus(contentId, finalStatus);
                    console.log(`[Auto-Pilot] Ad Campaign published successfully!`);
                }
            } catch (publishErr) {
                console.error("[Auto-Pilot] Failed to auto-publish Ad:", publishErr);
                // Fall back to PENDING_APPROVAL on failure
            }
        }

        if (task.type === 'article') {
            try {
                console.log(`[Auto-Pilot] Auto-publishing Article to Meta: ${task.title}`);
                const { publishToFacebook, publishToInstagram } = await import("@/lib/meta");

                // Generate a quick promotional image for Social Media
                let socialImageUrl: string | undefined;
                try {
                    socialImageUrl = (await generateNanoImages(`Professional promotional image for blog post: ${task.title}, high quality`, 1))[0];
                } catch (e) {
                    console.error("Nano image generation skipped for Meta post", e);
                }

                // Publish to Facebook
                const fbResult = await publishToFacebook(`New Article Published: ${task.title}\n\n${task.description}`, undefined, socialImageUrl);

                // Publish to Instagram (IG requires an image)
                let igResult: { success: boolean, error?: string, id?: string, platform?: string } = { success: false, error: 'No image available for Instagram' };
                if (socialImageUrl) {
                    igResult = await publishToInstagram(`New Article:\n${task.title}\n\n${task.description}\n\n#LinkInBio`, socialImageUrl);
                }

                if (fbResult.success || igResult.success) {
                    finalStatus = 'PUBLISHED';
                    contentItem.status = finalStatus;
                    await ContentStore.updateStatus(contentId, finalStatus);
                    console.log(`[Auto-Pilot] Article published to Meta successfully! (FB: ${fbResult.success}, IG: ${igResult.success})`);
                }
            } catch (metaErr) {
                console.error("[Auto-Pilot] Failed to auto-publish Article to Meta:", metaErr);
            }
        }

        // Update Strategy Task Status
        const strategy = await StrategyStore.get();
        if (strategy) {
            let taskUpdated = false;
            for (const phase of strategy.phases) {
                const targetTask = phase.tasks.find(t => t.id === task.id);
                if (targetTask) {
                    targetTask.status = finalStatus;
                    targetTask.contentId = contentId;
                    taskUpdated = true;
                    break;
                }
            }
            if (taskUpdated) {
                await StrategyStore.save(strategy);
            }
        }

        return NextResponse.json({
            success: true,
            taskId: task.id,
            contentId: contentId,
            status: finalStatus,
            content: finalResult // Return content for immediate UI update
        });

    } catch (error: any) {
        console.error("Task execution error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

