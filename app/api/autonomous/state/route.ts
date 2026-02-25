import { NextResponse } from "next/server";
import { StrategyStore, ContentStore } from "@/lib/store";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const strategy = await StrategyStore.get();
        const content = await ContentStore.getAll();

        return NextResponse.json({
            strategy,
            content
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
