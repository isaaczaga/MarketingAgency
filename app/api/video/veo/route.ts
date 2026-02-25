
import { NextRequest, NextResponse } from "next/server";
import { generateVeoVideo, getVeoOperation } from "../../../../lib/veo";

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const data = await generateVeoVideo(prompt);
        // data.name should be the operation name, e.g., "operations/..."
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Veo API POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate video" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get("name");

        if (!name) {
            return NextResponse.json(
                { error: "Operation name is required" },
                { status: 400 }
            );
        }

        const operation = await getVeoOperation(name);

        // If done, we expect 'response' in the operation object
        if (operation.done) {
            if (operation.error) {
                return NextResponse.json({
                    status: "failed",
                    error: operation.error
                });
            }

            // Success!
            // The structure of 'response' depends on the model.
            // For Veo, it typically returns a 'videos' list with 'uri'
            // Let's return the whole operation helper for the frontend to parse
            // or specific fields if known. 
            // We'll return the full object for flexibility during dev.
            return NextResponse.json({
                status: "completed",
                result: operation.response
            });
        }

        return NextResponse.json({ status: "processing" });

    } catch (error: any) {
        console.error("Veo API GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to check status" },
            { status: 500 }
        );
    }
}
