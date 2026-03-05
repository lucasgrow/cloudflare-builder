import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runAgentLoop } from "@/lib/agent/loop";
import { AGENT_TOOLS, createToolHandlers } from "@/lib/agent/tools";
import { buildAgentSystemPrompt } from "@/lib/agent/system-prompt";

export const dynamic = "force-dynamic";

const agentPlanSchema = z.object({
  freeText: z.string().min(10).max(10000),
  refImageR2Key: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const parsed = agentPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { env } = getCloudflareContext();
  const cfEnv = env as CloudflareEnv;
  const apiKey = cfEnv.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }
  const db = cfEnv.DATABASE;

  // Verify project exists
  const project = await db
    .prepare(`SELECT id, name FROM projects WHERE id = ?`)
    .bind(id)
    .first();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const toolHandlers = createToolHandlers({ db, projectId: id });
  const systemPrompt = buildAgentSystemPrompt(!!parsed.data.refImageR2Key);

  try {
    const result = await runAgentLoop({
      apiKey,
      baseURL: cfEnv.ANTHROPIC_BASE_URL || undefined,
      systemPrompt,
      userMessage: parsed.data.freeText,
      tools: AGENT_TOOLS,
      toolHandlers,
      maxTurns: 6,
    });

    const submitCall = result.toolCalls.find((tc) => tc.name === "submit_plan");
    if (!submitCall) {
      return NextResponse.json(
        { error: "Agent did not produce a plan" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      plan: submitCall.input,
      refImageR2Key: parsed.data.refImageR2Key || null,
      agentTurns: result.turns,
    });
  } catch (err) {
    console.error("Agent loop failed:", err);
    return NextResponse.json(
      { error: "Agent failed", details: String(err) },
      { status: 500 }
    );
  }
}
