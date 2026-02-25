import * as dotenv from 'dotenv';
import { publishToFacebook, publishToInstagram } from '@/lib/meta';

dotenv.config({ path: '.env.local' });

async function verifyMetaConnection() {
    console.log("--- Verifying Meta Connections ---");

    if (!process.env.META_SYSTEM_USER_TOKEN) {
        console.error("❌ MISSING: META_SYSTEM_USER_TOKEN");
        process.exit(1);
    }

    if (!process.env.FACEBOOK_PAGE_ID) {
        console.error("❌ MISSING: FACEBOOK_PAGE_ID");
    } else {
        console.log(`✅ FOUND FACEBOOK_PAGE_ID: ${process.env.FACEBOOK_PAGE_ID}`);
    }

    if (!process.env.INSTAGRAM_ACCOUNT_ID) {
        console.error("❌ MISSING: INSTAGRAM_ACCOUNT_ID");
    } else {
        console.log(`✅ FOUND INSTAGRAM_ACCOUNT_ID: ${process.env.INSTAGRAM_ACCOUNT_ID}`);
    }

    console.log("\nAttempting to publish a test post to Facebook...");
    try {
        const fbResult = await publishToFacebook("Hello from One-Click Agency! This is an automated test post to verify API connectivity. 🚀");
        if (fbResult.success) {
            console.log(`✅ Successfully published to Facebook! Post ID: ${fbResult.id}`);
        } else {
            console.error(`❌ Failed to publish to Facebook: ${fbResult.error}`);
        }
    } catch (e: any) {
        console.error(`❌ Exception during Facebook test: ${e.message}`);
    }

    if (process.env.INSTAGRAM_ACCOUNT_ID) {
        console.log("\nAttempting to publish a test photo to Instagram...");
        try {
            // We need a public URL for Instagram to pull from
            const testImageUrl = "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1000&auto=format&fit=crop";
            const igResult = await publishToInstagram("Hello from One-Click Agency! Testing automated IG publishing 🚀 #AI", testImageUrl);
            if (igResult.success) {
                console.log(`✅ Successfully published to Instagram! Media ID: ${igResult.id}`);
            } else {
                console.error(`❌ Failed to publish to Instagram: ${igResult.error}`);
            }
        } catch (e: any) {
            console.error(`❌ Exception during Instagram test: ${e.message}`);
        }
    }

    console.log("\n--- Test Finished ---");
}

verifyMetaConnection();
