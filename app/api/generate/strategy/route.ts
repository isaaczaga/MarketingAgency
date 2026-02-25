import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { StrategyStore } from "@/lib/store";
import { DigitalStrategy, StrategyPhase, StrategyTask, ContentStatus } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { brandProfile } = await request.json();

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile is required" }, { status: 400 });
    }

    const prompt = `
Generate a comprehensive 3-month digital marketing strategy for a business with the following profile:
Title: ${brandProfile.title}
Description: ${brandProfile.description}
Voice: ${brandProfile.brandVoice}
Audience: ${brandProfile.targetAudience}
Keywords: ${brandProfile.keywords?.join(", ")}

The response MUST be a valid JSON object with the following structure:
{
  "objectives": ["string"],
  "phases": [
    {
      "title": "Phase 1: Foundation (Month 1)",
      "tasks": [
        {
          "type": "article | video | podcast | ad | keyword",
          "title": "Title of the specific task",
          "description": "Short description of what needs to be done. Be specific.",
          "scheduledDate": "YYYY-MM-DD (approximate)"
        }
      ]
    }
  ]
}

Include at least 3 phases and 4-5 tasks per phase. Ensure tasks are specific and actionable.
`;

    const responseText = await generateWithGemini(prompt);

    // Clean the response
    const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const rawStrategy = JSON.parse(jsonString);

    // Transform into DigitalStrategy with IDs
    const newStrategy: DigitalStrategy = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      brandProfile: brandProfile,
      objectives: rawStrategy.objectives || [],
      phases: rawStrategy.phases.map((phase: any) => ({
        id: uuidv4(),
        title: phase.title,
        tasks: phase.tasks.map((task: any) => ({
          id: uuidv4(),
          phase: phase.title,
          type: task.type,
          title: task.title,
          description: task.description,
          status: 'PLANNED' as ContentStatus,
          scheduledDate: task.scheduledDate || new Date().toISOString()
        }))
      }))
    };

    // Save to store
    await StrategyStore.save(newStrategy);

    return NextResponse.json(newStrategy);

  } catch (error: any) {
    console.error("Strategy generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
