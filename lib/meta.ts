const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export async function publishToFacebook(message: string, link?: string, imageUrl?: string) {
    const META_SYSTEM_USER_TOKEN = process.env.META_SYSTEM_USER_TOKEN;
    const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

    if (!META_SYSTEM_USER_TOKEN || !FACEBOOK_PAGE_ID) {
        throw new Error('Meta credentials not fully configured for Facebook');
    }

    try {
        // Determine the page access token first
        const tokenUrl = `${BASE_URL}/${FACEBOOK_PAGE_ID}?fields=access_token&access_token=${META_SYSTEM_USER_TOKEN}`;
        const tokenRes = await fetch(tokenUrl);
        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Failed to fetch Page Access Token:', tokenData);
            throw new Error('No se pudo obtener el Page Access Token. Verifica que el Usuario del Sistema tenga acceso a la Página.');
        }

        const pageAccessToken = tokenData.access_token;

        let url = `${BASE_URL}/${FACEBOOK_PAGE_ID}/feed`;
        let body: any = {
            message,
            access_token: pageAccessToken,
        };

        if (imageUrl) {
            // If publishing a photo, the endpoint changes to /photos
            url = `${BASE_URL}/${FACEBOOK_PAGE_ID}/photos`;
            body.url = imageUrl;
            body.caption = message; // for photos, message is usually passed as caption
            delete body.message;
        } else if (link) {
            body.link = link;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Facebook publish error:', data);
            throw new Error(data.error?.message || 'Failed to publish to Facebook');
        }

        return { success: true, id: data.id, platform: 'facebook' };
    } catch (error: any) {
        console.error('Error publishing to Facebook:', error);
        return { success: false, error: error.message, platform: 'facebook' };
    }
}

export async function publishToInstagram(caption: string, imageUrl: string) {
    const META_SYSTEM_USER_TOKEN = process.env.META_SYSTEM_USER_TOKEN;
    const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!META_SYSTEM_USER_TOKEN || !INSTAGRAM_ACCOUNT_ID) {
        throw new Error('Meta credentials not fully configured for Instagram');
    }

    try {
        // Step 1: Create media container
        const createUrl = `${BASE_URL}/${INSTAGRAM_ACCOUNT_ID}/media`;
        const createBody = {
            image_url: imageUrl,
            caption: caption,
            access_token: META_SYSTEM_USER_TOKEN,
        };

        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(createBody),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
            console.error('Instagram media create error:', createData);
            throw new Error(createData.error?.message || 'Failed to create Instagram media container');
        }

        const creationId = createData.id;

        // Step 1.5: Poll the container until it is FINISHED processing
        let isReady = false;
        let attempts = 0;
        const maxAttempts = 15; // 45 seconds total wait max

        while (!isReady && attempts < maxAttempts) {
            attempts++;
            const statusUrl = `${BASE_URL}/${creationId}?fields=status_code&access_token=${META_SYSTEM_USER_TOKEN}`;
            const statusRes = await fetch(statusUrl);
            const statusData = await statusRes.json();

            if (statusData.status_code === 'FINISHED') {
                isReady = true;
                break;
            } else if (statusData.status_code === 'ERROR') {
                throw new Error(`Instagram media processing failed: ${statusData.status}`);
            }

            console.log(`[Meta API] Waiting for Instagram media to process... (Attempt ${attempts}/${maxAttempts})`);
            // Wait 3 seconds before next query
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if (!isReady) {
            throw new Error(`Timed out waiting for Instagram media processing to finish for Creation ID: ${creationId}`);
        }

        // Step 2: Publish media container
        const publishUrl = `${BASE_URL}/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
        const publishBody = {
            creation_id: creationId,
            access_token: META_SYSTEM_USER_TOKEN,
        };

        const publishResponse = await fetch(publishUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(publishBody),
        });

        const publishData = await publishResponse.json();

        if (!publishResponse.ok) {
            console.error('Instagram media publish error:', publishData);
            throw new Error(publishData.error?.message || 'Failed to publish Instagram media container');
        }

        return { success: true, id: publishData.id, platform: 'instagram' };
    } catch (error: any) {
        console.error('Error publishing to Instagram:', error);
        return { success: false, error: error.message, platform: 'instagram' };
    }
}
