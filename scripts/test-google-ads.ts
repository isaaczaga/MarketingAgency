import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { initializeAdsClient, createSearchCampaign, createAdGroupAndAds } from '../lib/google-ads';
initializeAdsClient();

async function runTestCampaign() {
    console.log('--- Starting Test Campaign Creation ---');

    // 1. Create Campaign
    console.log('Creating Campaign...');
    const campaignResult = await createSearchCampaign('Test AI Campaign');

    if (!campaignResult.success || !campaignResult.campaignResourceName) {
        console.error('Failed to create campaign:', campaignResult.error);
        return;
    }
    console.log(`✅ Campaign created: ${campaignResult.campaignResourceName}`);

    // 2. Create Ad Group and Ads
    console.log('Creating Ad Group and Ads...');
    const adResult = await createAdGroupAndAds(campaignResult.campaignResourceName, 'Test AI Ad Group', {
        headlineParts: ['Buy Our Awesome Product', 'AI Marketing Agency', 'Best Prices Online'],
        descriptionParts: ['We offer the best AI marketing solutions for your business. Call us today!', 'Limited time offer on all services.'],
        finalUrl: 'https://www.homeloans.mx/'
    });

    if (!adResult.success) {
        console.error('Failed to create ads:', adResult.error);
        return;
    }

    console.log(`✅ Ad Group created: ${adResult.adGroupResourceName}`);
    console.log(`✅ Ad created: ${adResult.adResourceName}`);
    console.log('--- Test Finished Successfully ---');
}

runTestCampaign();
