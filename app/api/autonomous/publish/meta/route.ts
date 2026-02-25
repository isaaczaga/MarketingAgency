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
            // Check if content string has an image URL embedded, otherwise generate one
            const parsedContent = typeof contentItem.content === 'string' ? contentItem.content : JSON.stringify(contentItem.content);
            socialImageUrl = (await generateNanoImages(`Professional promotional image for blog post: ${contentItem.title}, high quality`, 1))[0];
        } catch (e) {
            console.error("Nano image generation skipped for Meta post", e);
        }

        // Publish to Facebook
        const fbResult = await publishToFacebook(`New Article Published: ${contentItem.title}\n\nRead more...`, undefined, socialImageUrl);

        // Publish to Instagram
        let igResult: any = { success: false, error: 'No image available for Instagram' };
        if (socialImageUrl) {
            igResult = await publishToInstagram(`New Article:\n${contentItem.title}\n\n#LinkInBio #Marketing`, socialImageUrl);
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
