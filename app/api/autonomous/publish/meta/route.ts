import { NextRequest, NextResponse } from "next/server";
import { ContentStore, StrategyStore } from "@/lib/store";
import { publishToFacebook, publishToInstagram } from "@/lib/meta";
import { generateNanoImages } from "@/lib/nano";
import { verifyServerAuth } from "@/lib/auth-server";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyServerAuth(request);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { contentId } = await request.json();

        if (!contentId) {
            return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
        }

        const contentItem = await ContentStore.getById(contentId);

        if (!contentItem) {
            return NextResponse.json({ error: "Content not found" }, { status: 404 });
        }

        if (contentItem.status === 'PUBLISHED') {
            return NextResponse.json({ error: "Content is already published" }, { status: 400 });
        }

        console.log(`[Manual Publish API] Publishing Article to Meta: ${contentItem.title}`);

        let socialImageUrl: string | undefined;
        try {
            // Meta APIs (especially Instagram) require a public URL, not base64.
            const nanoResult = await generateNanoImages(`Professional promotional image for blog post: ${contentItem.title}, high quality`, 1);
            if (nanoResult && nanoResult.length > 0) {
                const { uploadBase64Image } = await import('@/lib/storage');
                socialImageUrl = await uploadBase64Image(nanoResult[0]);
                console.log("Successfully generated and uploaded image for Meta:", socialImageUrl);
            }
        } catch (e) {
            console.error("Nano image generation skipped for Meta post", e);
        }

        // Determine the text to publish based on content type
        let postBody = contentItem.content || '';
        try {
            if (postBody.trim().startsWith('{')) {
                const data = JSON.parse(postBody);
                postBody = data.text || data.caption || data.script || data.adCopy?.[0]?.description || postBody;
            }
        } catch (e) {
            // If it's not valid JSON, we just use it as string, no problem.
        }

        // Clean up HTML tags and markdown blocks for social media (especially FB/IG which require plain text)
        postBody = postBody.replace(/```html/gi, '');
        postBody = postBody.replace(/```/g, '');
        // Replace structural tags with newlines to preserve paragraph spacing
        postBody = postBody.replace(/<(br|p|\/p|h1|h2|h3|h4|h5|h6|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6|li|\/li)[^>]*>/gi, '\n');
        // Strip out any remaining formatting tags (a, strong, em, span, div, etc)
        postBody = postBody.replace(/<[^>]*>?/g, ''); 
        // Convert basic HTML entities
        postBody = postBody.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
        // Collapse multiple blank lines down to a maximum of two (one empty line)
        postBody = postBody.replace(/\n\s*\n\s*/g, '\n\n').trim();

        const facebookMessage = `New Article Published: ${contentItem.title}\n\n${postBody}`;

        // Publish to Facebook
        const fbResult = await publishToFacebook(facebookMessage, undefined, socialImageUrl);

        // Publish to Instagram
        let igResult: any = { success: false, error: 'No image available for Instagram' };
        if (socialImageUrl) {
            const instagramCaption = `New Article:\n${contentItem.title}\n\n${postBody}\n\n#LinkInBio #Marketing`;
            // Instagram captions max out at 2200 chars, so we might need to truncate if too long,
            // but for typical generated content, we'll try to push it. If it fails, Meta API handles it.
            const truncatedIgCaption = instagramCaption.length > 2150
                ? instagramCaption.substring(0, 2147) + '...'
                : instagramCaption;
            igResult = await publishToInstagram(truncatedIgCaption, socialImageUrl);
        }

        if (fbResult.success || igResult.success) {
            await ContentStore.updateStatus(contentId, 'PUBLISHED');

            // Try updating task status
            const strategy = await StrategyStore.get();
            if (strategy) {
                let taskUpdated = false;
                for (const phase of strategy.phases) {
                    const targetTask = phase.tasks.find(t => t.contentId === contentId);
                    if (targetTask) {
                        targetTask.status = 'PUBLISHED';
                        taskUpdated = true;
                        break;
                    }
                }
                if (taskUpdated) await StrategyStore.save(strategy);
            }

            return NextResponse.json({
                success: true,
                facebook: fbResult,
                instagram: igResult
            });
        } else {
            return NextResponse.json({
                error: `Facebook: ${fbResult.error} | Instagram: ${igResult.error}`
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Meta publish error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
