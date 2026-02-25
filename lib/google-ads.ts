import { GoogleAdsApi, enums } from 'google-ads-api';

// Initialize the Google Ads API client
// This uses the credentials we placed in .env.local
let client: GoogleAdsApi | null = null;

export function initializeAdsClient() {
    try {
        if (
            process.env.GOOGLE_ADS_CLIENT_ID &&
            process.env.GOOGLE_ADS_CLIENT_SECRET &&
            process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
            process.env.GOOGLE_ADS_REFRESH_TOKEN
        ) {
            client = new GoogleAdsApi({
                client_id: process.env.GOOGLE_ADS_CLIENT_ID,
                client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
                developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            });
            console.log('Google Ads Client Initialized');
        } else {
            console.warn('Google Ads credentials missing from env variables');
        }
    } catch (error) {
        console.error('Failed to initialize Google Ads Client:', error);
    }
}

// Auto-initialize for Next.js environment
initializeAdsClient();

/**
 * Returns the authenticated customer instance for making API calls.
 * Throws an error if the client isn't initialized or if CUSTOMER_ID is missing.
 */
export function getCustomer() {
    if (!client) {
        throw new Error('Google Ads client is not initialized. Check your .env.local variables.');
    }

    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    if (!customerId) {
        throw new Error('GOOGLE_ADS_CUSTOMER_ID is missing from .env.local');
    }

    return client.Customer({
        customer_id: customerId,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN as string,
    });
}

/**
 * Verifies the connection by fetching accessible customers.
 */
export async function verifyConnection() {
    if (!client) {
        return { success: false, error: 'Client not initialized' };
    }

    try {
        const customers = await client.listAccessibleCustomers(process.env.GOOGLE_ADS_REFRESH_TOKEN as string);
        return { success: true, customers };
    } catch (error: any) {
        console.error('Error verifying Google Ads connection:', error);
        return { success: false, error: error.message };
    }
}

export interface AdContent {
    headlineParts: string[]; // up to 15, max 30 chars each
    descriptionParts: string[]; // up to 4, max 90 chars each
    finalUrl: string;
}

/**
 * Creates a basic Search campaign in a PAUSED state.
 */
export async function createSearchCampaign(name: string, budgetAmountMicros: number = 5000000) {
    const customer = getCustomer();

    try {
        // 1. Create a Campaign Budget
        const budgetResponse = await customer.campaignBudgets.create([{
            name: `${name} Budget #${Date.now()}`,
            amount_micros: budgetAmountMicros, // E.g., 5000000 = $5.00
            delivery_method: enums.BudgetDeliveryMethod.STANDARD,
            explicitly_shared: false,
        }]);

        const budgetResourceName = budgetResponse.results[0].resource_name;

        // 2. Create the Campaign
        const campaignResponse = await customer.campaigns.create([{
            name: `${name} #${Date.now()}`,
            advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
            status: enums.CampaignStatus.PAUSED, // Keep PAUSED so it doesn't spend money immediately
            manual_cpc: {},
            contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
            campaign_budget: budgetResourceName,
            network_settings: {
                target_google_search: true,
                target_search_network: true,
                target_content_network: false,
                target_partner_search_network: false,
            }
        }]);

        return {
            success: true,
            campaignResourceName: campaignResponse.results[0].resource_name,
        };
    } catch (error: any) {
        console.error('Google Ads Create Campaign Error:', JSON.stringify(error?.errors || error, null, 2));
        return { success: false, error: JSON.stringify(error?.errors || error?.message) };
    }
}

/**
 * Creates an Ad Group and a Responsive Search Ad within the given Campaign.
 */
export async function createAdGroupAndAds(campaignResourceName: string, adGroupName: string, adContent: AdContent) {
    const customer = getCustomer();

    try {
        // 1. Create Ad Group
        const adGroupResponse = await customer.adGroups.create([{
            name: `${adGroupName} #${Date.now()}`,
            campaign: campaignResourceName,
            status: enums.AdGroupStatus.ENABLED,
            type: enums.AdGroupType.SEARCH_STANDARD,
            cpc_bid_micros: 1000000, // $1.00 max bid
        }]);

        const adGroupResourceName = adGroupResponse.results[0].resource_name;

        // 2. Create the Responsive Search Ad
        const adResponse = await customer.adGroupAds.create([{
            ad_group: adGroupResourceName,
            status: enums.AdGroupAdStatus.ENABLED,
            ad: {
                final_urls: [adContent.finalUrl],
                responsive_search_ad: {
                    headlines: adContent.headlineParts.map(text => ({ text })),
                    descriptions: adContent.descriptionParts.map(text => ({ text })),
                }
            }
        }]);

        return {
            success: true,
            adGroupResourceName: adGroupResourceName,
            adResourceName: adResponse.results[0].resource_name,
        };
    } catch (error: any) {
        console.error('Google Ads Create Ad Error:', error);
        return { success: false, error: error.message };
    }
}
