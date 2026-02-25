import { NextResponse } from 'next/server';
import { createSearchCampaign, createAdGroupAndAds, AdContent } from '@/lib/google-ads';
import { verifyServerAuth } from '@/lib/auth-server';

export async function POST(req: Request) {
    try {
        const user = await verifyServerAuth(req as any);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { campaignName, budget, adGroupName, adContent } = body;

        // Basic validation
        if (!campaignName || !adGroupName || !adContent) {
            return NextResponse.json(
                { error: 'Missing required fields: campaignName, adGroupName, adContent are required.' },
                { status: 400 }
            );
        }

        const adData: AdContent = {
            headlineParts: adContent.headlineParts || [],
            descriptionParts: adContent.descriptionParts || [],
            finalUrl: adContent.finalUrl
        };

        if (adData.headlineParts.length < 3 || adData.descriptionParts.length < 2 || !adData.finalUrl) {
            return NextResponse.json(
                { error: 'adContent must include at least 3 headlines, 2 descriptions, and a finalUrl.' },
                { status: 400 }
            );
        }

        // 1. Create Campaign
        const campaignResult = await createSearchCampaign(campaignName, budget || 5000000);
        if (!campaignResult.success || !campaignResult.campaignResourceName) {
            return NextResponse.json(
                { error: 'Failed to create Campaign', details: campaignResult.error },
                { status: 500 }
            );
        }

        // 2. Create Ad Group and Ads
        const adResult = await createAdGroupAndAds(campaignResult.campaignResourceName, adGroupName, adData);
        if (!adResult.success) {
            return NextResponse.json(
                { error: 'Failed to create Ad Group and Ads', details: adResult.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            campaignResourceName: campaignResult.campaignResourceName,
            adGroupResourceName: adResult.adGroupResourceName,
            adResourceName: adResult.adResourceName,
            message: 'Google Ads Search Campaign drafted successfully.'
        });

    } catch (error: any) {
        console.error('Google Ads Publish API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process Google Ads publish request', details: error.message },
            { status: 500 }
        );
    }
}
