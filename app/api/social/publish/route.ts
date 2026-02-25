import { NextResponse } from 'next/server';
import { publishToFacebook, publishToInstagram } from '@/lib/meta';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { platforms, content } = body;

        // Expected platforms: ['facebook', 'instagram']
        // Expected content: { text: "...", imageUrl: "...", link: "..." }

        if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
            return NextResponse.json(
                { error: 'Platforms array is required' },
                { status: 400 }
            );
        }

        if (!content || !content.text) {
            return NextResponse.json(
                { error: 'Content with text is required' },
                { status: 400 }
            );
        }

        // Process each platform concurrently
        const publishPromises = platforms.map(async (platform) => {
            if (platform === 'facebook') {
                return publishToFacebook(content.text, content.link, content.imageUrl);
            } else if (platform === 'instagram') {
                if (!content.imageUrl) {
                    return {
                        success: false,
                        error: 'Instagram requires an imageUrl for posting via Graph API',
                        platform: 'instagram',
                    };
                }
                return publishToInstagram(content.text, content.imageUrl);
            } else {
                return {
                    success: false,
                    error: `Unsupported platform: ${platform}`,
                    platform,
                };
            }
        });

        const resolvedResults = await Promise.all(publishPromises);

        // Check if any failed
        const hasErrors = resolvedResults.some((res) => !res.success);

        return NextResponse.json({
            success: !hasErrors,
            results: resolvedResults,
        });

    } catch (error: any) {
        console.error('Social publish API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error while publishing' },
            { status: 500 }
        );
    }
}
