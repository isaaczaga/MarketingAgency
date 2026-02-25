
import { generateWithGemini, BrandContext } from "@/lib/gemini";
import { generateVeoVideo } from "@/lib/veo";
import { generateNanoImages } from "@/lib/nano";
import { generatePodcastScript } from "@/lib/podcast";
import { ContentItem, StrategyTask } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export const ContentGenerator = {
    executeTask: async (task: StrategyTask, brandContext?: BrandContext, previousResults: any[] = []) => {
        console.time(`Task-${task.id}`);
        console.log(`[ContentGenerator] Starting task: ${task.title} (${task.type})`);
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
                // For Veo, we generate a visual prompt first, then call Veo
                const visualPrompt = await generateWithGemini(`Create a highly detailed visual prompt for a 6-second cinematic video about "${task.title}". 
                Description: ${task.description}. 
                Style: Cinematic, 4k, Photorealistic. 
                Output ONLY the visual prompt text.`, brandContext);

                // Call Veo
                console.log("Generating Video with Veo:", visualPrompt);
                try {
                    const veoOperation = await generateVeoVideo(visualPrompt);
                    finalResult = JSON.stringify({
                        status: "processing",
                        type: "veo",
                        operation: veoOperation,
                        prompt: visualPrompt
                    });
                } catch (e: any) {
                    console.error("Veo Error:", e);
                    finalResult = JSON.stringify({
                        status: "failed",
                        error: e.message,
                        prompt: visualPrompt
                    });
                }
                break;

            case 'podcast':
                // Generate Script
                const script = await generatePodcastScript(task.title, 5, brandContext);
                finalResult = JSON.stringify({
                    type: "podcast_script",
                    script: script
                });
                break;

            case 'image':
            case 'ad':
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
                throw new Error(`Unsupported task type: ${task.type}`);
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

        console.timeEnd(`Task-${task.id}`);
        console.log(`[ContentGenerator] Finished task: ${task.title}`);
        return { contentItem, contentId, finalResult };
    }
};
