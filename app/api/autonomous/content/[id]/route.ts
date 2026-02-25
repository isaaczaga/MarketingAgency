import { NextRequest, NextResponse } from "next/server";
import { ContentStore, StrategyStore } from "@/lib/store";

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();

        // Validation
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const existingItem = await ContentStore.getById(id);
        if (!existingItem) {
            return NextResponse.json({ error: "Content not found" }, { status: 404 });
        }

        // Update fields
        if (body.content) existingItem.content = body.content;
        if (body.status) existingItem.status = body.status;
        if (body.feedback) existingItem.feedback = body.feedback;

        existingItem.updatedAt = new Date().toISOString();

        await ContentStore.save(existingItem);

        // Sync status to Strategy Task if status changed
        if (body.status) {
            const strategy = await StrategyStore.get();
            if (strategy) {
                let taskUpdated = false;
                for (const phase of strategy.phases) {
                    const task = phase.tasks.find(t => t.id === existingItem.taskId);
                    if (task) {
                        task.status = body.status;
                        taskUpdated = true;
                        break;
                    }
                }
                if (taskUpdated) await StrategyStore.save(strategy);
            }
        }

        return NextResponse.json({ success: true, item: existingItem });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const item = await ContentStore.getById(id);
    if (!item) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }
    return NextResponse.json(item);
}
