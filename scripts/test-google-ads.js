"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env.local' });
const google_ads_1 = require("../lib/google-ads");
(0, google_ads_1.initializeAdsClient)();
async function runTestCampaign() {
    console.log('--- Starting Test Campaign Creation ---');
    // 1. Create Campaign
    console.log('Creating Campaign...');
    const campaignResult = await (0, google_ads_1.createSearchCampaign)('Test AI Campaign');
    if (!campaignResult.success || !campaignResult.campaignResourceName) {
        console.error('Failed to create campaign:', campaignResult.error);
        return;
    }
    console.log(`✅ Campaign created: ${campaignResult.campaignResourceName}`);
    // 2. Create Ad Group and Ads
    console.log('Creating Ad Group and Ads...');
    const adResult = await (0, google_ads_1.createAdGroupAndAds)(campaignResult.campaignResourceName, 'Test AI Ad Group', {
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
