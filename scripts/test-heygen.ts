import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testHeygen() {
    const heygenKey = process.env.HEYGEN_API_KEY;
    console.log("Key:", heygenKey?.substring(0, 10));
    
    const response = await fetch("https://api.heygen.com/v2/video/generate", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": heygenKey!,
        },
        body: JSON.stringify({
            video_inputs: [
                {
                    character: {
                        type: "avatar",
                        avatar_id: "8b0a9ae8e76541baa2be676d04600e04",
                        avatar_style: "normal",
                    },
                    voice: {
                        type: "text",
                        input_text: "Hello this is a test.",
                        voice_id: "1c651b8254304a298f6f35585f2e1d04",
                    },
                },
            ],
            dimension: { width: 1920, height: 1080 },
            aspect_ratio: "16:9",
        }),
    });

    if (!response.ok) {
        console.error("Error Status:", response.status);
        console.error("Error Text:", await response.text());
        return;
    }
    const data = await response.json();
    console.log("Success:", data);
}
testHeygen();
