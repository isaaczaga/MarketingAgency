import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { publishToInstagram } from '../lib/meta';
import { generateNanoImages } from '../lib/nano';

async function main() {
    console.log("Starting Instagram Publish Test...");

    let imageUrl = "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=1000"; // Fallback URL
    try {
        console.log("Generating test image...");
        const urls = await generateNanoImages("A beautiful sunrise over a digital laptop, 4k, professional photography", 1);
        if (urls && urls.length > 0) {
            imageUrl = urls[0];
            console.log("Successfully generated test image:", imageUrl.substring(0, 50) + "...");
        }
    } catch (e) {
        console.error("Image generation failed, using fallback:", e);
    }

    try {
        console.log("Attempting to publish to Instagram...");
        const result = await publishToInstagram("Hello from the Auto-Pilot debug script! #Testing #AI", imageUrl);
        console.log("Publish Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Fatal Publish Error:", e);
    }
}

main();
