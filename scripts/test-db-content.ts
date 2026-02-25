import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const { ContentStore } = await import('../lib/store');
    const items = await ContentStore.getAll();
    const videoItems = items.filter(i => i.type === 'video');
    // Sort by createdAt descending
    videoItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log("Found", videoItems.length, "video items.");
    for (let i = 0; i < Math.min(3, videoItems.length); i++) {
        console.log(`\nItem ${i + 1} (${videoItems[i].createdAt}):`);
        console.log(videoItems[i].content);
    }
}
check();
