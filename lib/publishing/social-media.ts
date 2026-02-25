
import { ContentItem } from "@/lib/types";

export const SocialMediaService = {
    publishToLinkedIn: async (content: ContentItem) => {
        console.log(`[LinkedIn] Posting: ${content.title}`);
        await simulateDelay();

        let postBody = "";
        try {
            // If content is JSON (from Ad/Image task), parse it. 
            // If it's a string (Article), use description or snippet.
            if (content.content.startsWith('{')) {
                const data = JSON.parse(content.content);
                postBody = data.adCopy?.[0]?.description || data.script || content.title;
            } else {
                postBody = content.content.substring(0, 200) + "...";
            }
        } catch (e) {
            postBody = content.title;
        }

        console.log(`[LinkedIn] Body: "${postBody}"`);
        if (content.type === 'image' || content.type === 'ad') {
            console.log(`[LinkedIn] Attaching Media: [Image/Video MockID]`);
        }

        return {
            success: true,
            platform: "LinkedIn",
            postId: `LI-${Math.floor(Math.random() * 100000)}`,
            url: `https://linkedin.com/feed/update/urn:li:activity:${Math.floor(Math.random() * 100000)}`
        };
    },

    publishToTwitter: async (content: ContentItem) => {
        console.log(`[Twitter] Tweeting: ${content.title}`);
        await simulateDelay();
        return {
            success: true,
            platform: "Twitter",
            postId: `TW-${Math.floor(Math.random() * 100000)}`,
            url: `https://twitter.com/user/status/${Math.floor(Math.random() * 100000)}`
        };
    },

    publishToFacebook: async (content: ContentItem) => {
        console.log(`[Facebook] Posting: ${content.title}`);
        await simulateDelay();
        return {
            success: true,
            platform: "Facebook",
            postId: `FB-${Math.floor(Math.random() * 100000)}`,
            url: `https://facebook.com/posts/${Math.floor(Math.random() * 100000)}`
        };
    },

    publishToInstagram: async (content: ContentItem) => {
        console.log(`[Instagram] Posting Reel/Image: ${content.title}`);
        await simulateDelay();
        return {
            success: true,
            platform: "Instagram",
            postId: `IG-${Math.floor(Math.random() * 100000)}`,
            url: `https://instagram.com/p/${Math.floor(Math.random() * 100000)}`
        };
    }
};

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 1000));
