
const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Using a likely available model from search results
const MODEL = "models/veo-2.0-generate-001";

export async function generateVeoVideo(prompt: string) {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // Veo typically uses the predictLongRunning endpoint
    const url = `${BASE_URL}/${MODEL}:predictLongRunning?key=${API_KEY}`;

    // Vertex AI / Veo style payload for valid JSON
    // Sometimes simply 'prompt' or 'text_prompt'
    const body = {
        instances: [
            {
                prompt: prompt
            }
        ],
        parameters: {
            sampleCount: 1,
            // aspect_ratio: "16:9" // optional
        }
    };

    console.log("Calling Veo API:", url);
    console.log("Payload:", JSON.stringify(body));

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Veo API Error:", response.status, errorText);

        // Fallback: If 404, maybe models/ prefix is double included or missing? 
        // The const MODEL includes "models/", and URL join is correct.

        throw new Error(`Veo API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    // Expecting { name: "projects/.../operations/..." } or similar
    console.log("Veo Generation Started:", data);
    return data;
}

export async function getVeoOperation(operationName: string) {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // operationName is usually relative, e.g. "operations/..."
    // If it comes with a full path, we might need to handle it.
    // Generally the API returns "name": "operations/..."
    const url = `${BASE_URL}/${operationName}?key=${API_KEY}`;

    console.log("Polling Veo Operation:", url);

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Veo Operation Error:", response.status, errorText);
        throw new Error(`Veo Operation Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Transform for frontend consumption if needed
    // Check if "done": true
    if (data.done) {
        if (data.error) {
            return { status: "failed", error: data.error };
        }

        // Success. The result is typically in 'response'
        // For Veo it might be data.response.videos[0].uri 
        // or data.response.result...
        // We pass the raw response back to the frontend to parse

        return {
            status: "completed",
            result: data.response
        };
    }

    return { status: "processing" };
}
