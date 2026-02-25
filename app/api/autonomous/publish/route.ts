import { NextRequest, NextResponse } from "next/server";
import { ContentStore } from "@/lib/store";
import { GoogleAdsService } from "@/lib/publishing/google-ads";
import { SocialMediaService } from "@/lib/publishing/social-media";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { contentId } = await request.json();

        if (!contentId) {
            return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
        }

        const content = await ContentStore.getById(contentId);
        if (!content) {
            return NextResponse.json({ error: "Content not found" }, { status: 404 });
        }

        if (content.status !== 'APPROVED') {
            return NextResponse.json({ error: "Content must be APPROVED to publish" }, { status: 400 });
        }

        let result;
        // Dispatch to appropriate service based on type
        // Note: In a real app, 'type' might not map 1:1 to platform, we'd need a 'platform' field or similar logic.
        // For now, we map types to likely platforms.

        switch (content.type) {
            case 'ad':
                result = await GoogleAdsService.publish(content);
                break;
            case 'article':
            case 'video': // Assuming generated video link is posted
            case 'podcast':
                // For now, treat these as "Social Media" posts (e.g. LinkedIn Article, Tweet)
                result = await SocialMediaService.publishToLinkedIn(content);
                break;
            case 'keyword':
                return NextResponse.json({ error: "Keyword research cannot be published directly" }, { status: 400 });
            default:
                result = await SocialMediaService.publishToTwitter(content);
        }

        if (result && result.success) {
            ContentStore.updateStatus(content.id, 'PUBLISHED');
            return NextResponse.json({ success: true, result });
        } else {
            return NextResponse.json({ error: "Publishing failed", result }, { status: 500 });
        }

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
