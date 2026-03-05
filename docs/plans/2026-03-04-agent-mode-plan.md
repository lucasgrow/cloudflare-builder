# Agent Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Agente" mode to generate page — Claude Sonnet analyzes free text, picks template, structures copy via tool-use loop, human reviews plan before generation.

**Architecture:** Manual tool-use loop with `@anthropic-ai/sdk` (already installed) on CF Workers. 5 custom tools executed server-side. New API route `/api/projects/{id}/agent/plan`. Frontend tabs to switch between structured/agent modes.

**Tech Stack:** `@anthropic-ai/sdk` (Claude Sonnet 4.6), Drizzle ORM (D1), HeroUI, existing `buildGenerationPrompt()`.

---

### Task 1: Agent Tool-Use Loop Engine

**Files:**
- Create: `src/lib/agent/loop.ts`

**Step 1: Create the generic tool-use loop**

```typescript
// src/lib/agent/loop.ts
import Anthropic from "@anthropic-ai/sdk";

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface ToolHandler {
  (input: Record<string, unknown>): Promise<string>;
}

interface AgentLoopOptions {
  apiKey: string;
  systemPrompt: string;
  userMessage: string;
  tools: ToolDefinition[];
  toolHandlers: Record<string, ToolHandler>;
  maxTurns?: number;
}

export interface AgentResult {
  content: string;
  toolCalls: Array<{ name: string; input: Record<string, unknown> }>;
  turns: number;
}

export async function runAgentLoop(options: AgentLoopOptions): Promise<AgentResult> {
  const { apiKey, systemPrompt, userMessage, tools, toolHandlers, maxTurns = 6 } = options;

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];
  const allToolCalls: AgentResult["toolCalls"] = [];
  let turns = 0;

  while (turns < maxTurns) {
    turns++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: tools as Anthropic.Tool[],
    });

    // Collect text and tool_use blocks
    const textBlocks = response.content.filter((b) => b.type === "text");
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

    if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      // Agent finished — return final text
      const finalText = textBlocks.map((b) => b.type === "text" ? b.text : "").join("\n");
      return { content: finalText, toolCalls: allToolCalls, turns };
    }

    // Execute tool calls
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      if (block.type !== "tool_use") continue;
      const handler = toolHandlers[block.name];
      allToolCalls.push({ name: block.name, input: block.input as Record<string, unknown> });

      if (!handler) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: unknown tool "${block.name}"`,
          is_error: true,
        });
        continue;
      }

      try {
        const result = await handler(block.input as Record<string, unknown>);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      } catch (e) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: `Error: ${e instanceof Error ? e.message : "unknown"}`,
          is_error: true,
        });
      }
    }

    messages.push({ role: "user", content: toolResults });
  }

  // Max turns reached — return whatever we have
  return { content: "Max turns reached without final answer.", toolCalls: allToolCalls, turns };
}
```

**Step 2: Verify it compiles**

Run: `bunx tsc --noEmit src/lib/agent/loop.ts`
Expected: no errors (or only unrelated existing ones)

**Step 3: Commit**

```bash
git add src/lib/agent/loop.ts
git commit -m "feat: add generic tool-use loop engine for agent mode"
```

---

### Task 2: Agent Tools — Definitions + Handlers

**Files:**
- Create: `src/lib/agent/tools.ts`
- Create: `src/lib/agent/system-prompt.ts`

**Step 1: Create tool definitions and handlers**

```typescript
// src/lib/agent/tools.ts
import type { ToolDefinition, ToolHandler } from "./loop";
import { buildGenerationPrompt } from "../prompts";

// Types for DB access — passed at runtime
export interface AgentContext {
  db: D1Database;
  projectId: string;
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "get_brand_config",
    description:
      "Get the brand configuration for this project: color palette, typography, logo descriptions, and prompt injection block. Always call this first.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_templates",
    description:
      "List all available templates with slug, name, and layout description. Use to decide which template fits the brief.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_template_prompt",
    description:
      "Get the full Gemini prompt template for a specific template. Call after choosing a template to understand its structure.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: {
          type: "string",
          description: "Template slug (e.g. checklist-split, centralizado)",
        },
      },
      required: ["templateSlug"],
    },
  },
  {
    name: "select_assets",
    description:
      "Check which visual assets are available for this project and template: logo (dark/light), professional photo, style references.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: {
          type: "string",
          description: "Template slug to check which assets apply",
        },
      },
      required: ["templateSlug"],
    },
  },
  {
    name: "submit_plan",
    description:
      "Submit your final creative plan. Call this when you have decided on template, headline, benefits, CTA, and keywords.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: { type: "string", description: "Chosen template slug" },
        headline: { type: "string", description: "Headline text, max 8 words, PT-BR" },
        benefits: {
          type: "array",
          items: { type: "string" },
          description: "Up to 3 benefit lines, 4-7 words each. Omit if template doesn't use them.",
        },
        ctaText: { type: "string", description: "CTA text, action-oriented" },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "1-2 keywords from headline to highlight in accent color",
        },
        reasoning: {
          type: "string",
          description: "1-2 sentences explaining why this template and copy structure",
        },
      },
      required: ["templateSlug", "headline", "ctaText", "keywords", "reasoning"],
    },
  },
];

export function createToolHandlers(ctx: AgentContext): Record<string, ToolHandler> {
  return {
    get_brand_config: async () => {
      const row = await ctx.db
        .prepare(
          "SELECT name, palette_json, typography_json, logo_description, prompt_injection, logo_dark_r2_key, logo_light_r2_key, photo_r2_key FROM projects WHERE id = ?"
        )
        .bind(ctx.projectId)
        .first<Record<string, string | null>>();

      if (!row) return "Error: project not found";

      return JSON.stringify({
        name: row.name,
        palette: JSON.parse(row.palette_json ?? "{}"),
        typography: JSON.parse(row.typography_json ?? "{}"),
        logoDescription: row.logo_description,
        hasLogoDark: !!row.logo_dark_r2_key,
        hasLogoLight: !!row.logo_light_r2_key,
        hasPhoto: !!row.photo_r2_key,
      });
    },

    list_templates: async () => {
      const rows = await ctx.db
        .prepare("SELECT slug, name, layout_description FROM templates WHERE is_custom = 0")
        .all<{ slug: string; name: string; layout_description: string | null }>();

      return JSON.stringify(
        rows.results.map((r) => ({
          slug: r.slug,
          name: r.name,
          layout: r.layout_description,
        }))
      );
    },

    get_template_prompt: async (input) => {
      const slug = input.templateSlug as string;
      const row = await ctx.db
        .prepare("SELECT prompt_template, layout_description FROM templates WHERE slug = ?")
        .bind(slug)
        .first<{ prompt_template: string; layout_description: string | null }>();

      if (!row) return `Error: template "${slug}" not found`;
      return JSON.stringify({ promptTemplate: row.prompt_template, layout: row.layout_description });
    },

    select_assets: async (input) => {
      const slug = input.templateSlug as string;
      const project = await ctx.db
        .prepare(
          "SELECT logo_dark_r2_key, logo_light_r2_key, photo_r2_key FROM projects WHERE id = ?"
        )
        .bind(ctx.projectId)
        .first<Record<string, string | null>>();

      if (!project) return "Error: project not found";

      const isDark = ["checklist-split", "checklist-dark", "centralizado"].includes(slug);
      const photoStyles = ["checklist-split", "checklist-clean", "half-half", "card-foto"];

      // Check style refs
      const refs = await ctx.db
        .prepare("SELECT id, type, label FROM project_refs WHERE project_id = ?")
        .bind(ctx.projectId)
        .all<{ id: string; type: string; label: string | null }>();

      return JSON.stringify({
        logo: isDark
          ? project.logo_dark_r2_key
            ? "dark"
            : project.logo_light_r2_key
            ? "light"
            : null
          : project.logo_light_r2_key
          ? "light"
          : project.logo_dark_r2_key
          ? "dark"
          : null,
        photo: photoStyles.includes(slug) && project.photo_r2_key ? "available" : "not_used",
        styleRefs: refs.results.filter((r) => r.type === "style_ref"),
      });
    },

    submit_plan: async (input) => {
      // This tool just echoes back — the plan is extracted from tool calls
      return JSON.stringify({ status: "plan_submitted", plan: input });
    },
  };
}
```

**Step 2: Create system prompt**

```typescript
// src/lib/agent/system-prompt.ts
import { DESIGN_PRINCIPLES } from "../design-principles";

export function buildAgentSystemPrompt(refImageProvided: boolean): string {
  let prompt = `You are a creative director for medical ad posts in Brazil.
You receive free-text briefs and produce structured creative specs that slot into pre-built Gemini prompt templates.

WORKFLOW:
1. Call get_brand_config — understand the client's palette, typography, and visual identity
2. Call list_templates — see all available layouts with descriptions
3. Analyze the brief: extract the core message, benefits, emotional tone
4. Pick the template that best fits (match tone → layout)
5. Structure the copy:
   - headline: max 8 words, PT-BR, impactful, clear benefit or curiosity
   - benefits: up to 3 items, 4-7 words each (only if template uses checklist)
   - ctaText: action-oriented, emotional ("Agende sua avaliação", "Garanta sua vaga")
   - keywords: 1-2 words from headline to highlight in accent color
6. Call submit_plan with your structured output and reasoning

TEMPLATE SELECTION GUIDE:
- Benefit-driven, educational, authority → checklist-split
- Single focus, high impact, awareness → centralizado
- Soft, lifestyle, wellness feel → checklist-clean
- Text-heavy, no photo available → checklist-dark
- Emotional, sensitive, relational → half-half
- Aspirational, treatment results → card-foto

RULES:
- You do NOT design layouts. Templates handle all visual specs (fonts, sizes, positions, colors).
- Your job is choosing the right template and writing compelling copy.
- Headlines must be in PT-BR (Brazilian Portuguese).
- If the brief is vague, infer benefits from context. Don't ask — decide.
- If no photo is available (select_assets returns not_used), avoid photo templates.
- Always call submit_plan at the end with your final decision.

${DESIGN_PRINCIPLES}`;

  if (refImageProvided) {
    prompt += `\n\nREFERENCE IMAGE NOTE:
The user provided a reference image for style guidance. When writing your reasoning in submit_plan, mention that the reference image should be used as visual style guide for composition mood and color treatment.`;
  }

  return prompt;
}
```

**Step 3: Verify it compiles**

Run: `bunx tsc --noEmit src/lib/agent/tools.ts src/lib/agent/system-prompt.ts`

**Step 4: Commit**

```bash
git add src/lib/agent/tools.ts src/lib/agent/system-prompt.ts
git commit -m "feat: agent tools definitions, handlers, and system prompt"
```

---

### Task 3: Agent API Route

**Files:**
- Create: `src/app/api/projects/[id]/agent/plan/route.ts`

**Step 1: Create the agent plan endpoint**

```typescript
// src/app/api/projects/[id]/agent/plan/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { runAgentLoop } from "@/lib/agent/loop";
import { AGENT_TOOLS, createToolHandlers } from "@/lib/agent/tools";
import { buildAgentSystemPrompt } from "@/lib/agent/system-prompt";
import { z } from "zod";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
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

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id: projectId } = params;
  const { freeText, refImageR2Key } = parsed.data;
  const { env } = getCloudflareContext();
  const cfEnv = env as CloudflareEnv;
  const anthropicKey = cfEnv.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  // Verify project exists
  const project = await cfEnv.DATABASE
    .prepare("SELECT id FROM projects WHERE id = ?")
    .bind(projectId)
    .first();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const ctx = { db: cfEnv.DATABASE, projectId };
  const handlers = createToolHandlers(ctx);
  const systemPrompt = buildAgentSystemPrompt(!!refImageR2Key);

  try {
    const result = await runAgentLoop({
      apiKey: anthropicKey,
      systemPrompt,
      userMessage: `Here is the creative brief:\n\n${freeText}`,
      tools: AGENT_TOOLS,
      toolHandlers: handlers,
      maxTurns: 6,
    });

    // Extract the plan from the submit_plan tool call
    const planCall = result.toolCalls.find((tc) => tc.name === "submit_plan");

    if (!planCall) {
      return NextResponse.json(
        { error: "Agent did not submit a plan", agentResponse: result.content },
        { status: 422 }
      );
    }

    const plan = planCall.input as {
      templateSlug: string;
      headline: string;
      benefits?: string[];
      ctaText: string;
      keywords: string[];
      reasoning: string;
    };

    return NextResponse.json({
      plan,
      refImageR2Key: refImageR2Key ?? null,
      agentTurns: result.turns,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Agent error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

**Step 2: Add `ANTHROPIC_API_KEY` to env**

Add to `.dev.vars`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Add to `cloudflare-env.d.ts` (or wherever CloudflareEnv is typed):
```typescript
ANTHROPIC_API_KEY: string;
```

**Step 3: Verify route compiles**

Run: `bunx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/api/projects/[id]/agent/plan/route.ts
git commit -m "feat: agent plan API route with tool-use loop"
```

---

### Task 4: Frontend — Agent Form Component

**Files:**
- Create: `src/components/projects/agent-form.tsx`

**Step 1: Create the agent input form**

```typescript
// src/components/projects/agent-form.tsx
"use client";

import { useState } from "react";
import { Button, Textarea, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

interface AgentPlan {
  templateSlug: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords: string[];
  reasoning: string;
}

interface AgentFormProps {
  projectId: string;
  onPlanReady: (plan: AgentPlan, refImageR2Key: string | null) => void;
}

export function AgentForm({ projectId, onPlanReady }: AgentFormProps) {
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // TODO Task 6: ref image upload state

  const handleSubmit = async () => {
    if (freeText.trim().length < 10) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/agent/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeText }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Failed to generate plan");
        return;
      }

      const data = (await res.json()) as {
        plan: AgentPlan;
        refImageR2Key: string | null;
      };
      onPlanReady(data.plan, data.refImageR2Key);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-divider">
      <CardBody className="gap-4">
        <div>
          <h3 className="text-lg font-semibold">Modo Agente</h3>
          <p className="text-small text-default-500">
            Descreva o que você quer. O agente vai escolher o template e estruturar o criativo.
          </p>
        </div>

        <Textarea
          label="Brief"
          placeholder="Ex: Quero um post sobre rinoplastia com resultado natural, mostrando os benefícios do procedimento e transmitindo confiança..."
          value={freeText}
          onValueChange={setFreeText}
          minRows={4}
          maxRows={10}
        />

        {/* TODO Task 6: ref image upload here */}

        {error && <p className="text-danger text-small">{error}</p>}

        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={loading}
          isDisabled={freeText.trim().length < 10}
          startContent={
            !loading && <Icon icon="solar:magic-stick-3-linear" width={20} />
          }
        >
          {loading ? "Agente pensando..." : "Planejar criativo"}
        </Button>
      </CardBody>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/projects/agent-form.tsx
git commit -m "feat: agent form component with free text input"
```

---

### Task 5: Frontend — Plan Preview Component

**Files:**
- Create: `src/components/projects/agent-plan-preview.tsx`

**Step 1: Create the plan preview/approval component**

```typescript
// src/components/projects/agent-plan-preview.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface AgentPlan {
  templateSlug: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords: string[];
  reasoning: string;
}

interface Template {
  id: string;
  name: string;
  slug: string;
  layoutDescription: string | null;
}

interface PlanPreviewProps {
  projectId: string;
  plan: AgentPlan;
  refImageR2Key: string | null;
  onBack: () => void;
}

export function AgentPlanPreview({
  projectId,
  plan,
  refImageR2Key,
  onBack,
}: PlanPreviewProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json() as Promise<Template[]>)
      .then(setTemplates);
  }, []);

  const currentTemplate = templates.find(
    (t) => t.slug === editedPlan.templateSlug
  );

  const handleApprove = async () => {
    const tpl = templates.find((t) => t.slug === editedPlan.templateSlug);
    if (!tpl) {
      setError("Template not found");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: [
            {
              templateId: tpl.id,
              headline: editedPlan.headline,
              benefits: editedPlan.benefits?.filter(Boolean),
              ctaText: editedPlan.ctaText,
              keywords: editedPlan.keywords.filter(Boolean),
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Failed to create job");
        return;
      }

      router.push(`/projects/${projectId}/gallery`);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const displayPlan = editing ? editedPlan : plan;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plano do Agente</h3>
          <p className="text-small text-default-500">{displayPlan.reasoning}</p>
        </div>
        <Button variant="light" size="sm" onPress={onBack}>
          <Icon icon="solar:arrow-left-linear" width={16} />
          Voltar
        </Button>
      </div>

      <Card className="border border-divider">
        <CardBody className="gap-3">
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color="secondary">
              {currentTemplate?.name ?? displayPlan.templateSlug}
            </Chip>
            {currentTemplate?.layoutDescription && (
              <span className="text-tiny text-default-400">
                {currentTemplate.layoutDescription}
              </span>
            )}
          </div>

          {editing ? (
            <>
              <Input
                label="Headline"
                value={editedPlan.headline}
                onValueChange={(v) =>
                  setEditedPlan((p) => ({ ...p, headline: v }))
                }
                size="sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    label={`Benefit ${i + 1}`}
                    value={editedPlan.benefits?.[i] ?? ""}
                    onValueChange={(v) =>
                      setEditedPlan((p) => {
                        const benefits = [...(p.benefits ?? ["", "", ""])];
                        benefits[i] = v;
                        return { ...p, benefits };
                      })
                    }
                    size="sm"
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  label="CTA"
                  value={editedPlan.ctaText}
                  onValueChange={(v) =>
                    setEditedPlan((p) => ({ ...p, ctaText: v }))
                  }
                  size="sm"
                />
                <Input
                  label="Keywords"
                  value={editedPlan.keywords.join(", ")}
                  onValueChange={(v) =>
                    setEditedPlan((p) => ({
                      ...p,
                      keywords: v.split(",").map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                  size="sm"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">{displayPlan.headline}</p>
              {displayPlan.benefits && displayPlan.benefits.length > 0 && (
                <div className="space-y-1">
                  {displayPlan.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-small">
                      <Icon
                        icon="solar:check-circle-linear"
                        width={16}
                        className="text-success"
                      />
                      {b}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="flat">
                  CTA: {displayPlan.ctaText}
                </Chip>
                {displayPlan.keywords.map((kw) => (
                  <Chip key={kw} size="sm" variant="dot" color="warning">
                    {kw}
                  </Chip>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {error && <p className="text-danger text-small">{error}</p>}

      <Divider />

      <div className="flex justify-end gap-2">
        <Button
          variant="flat"
          onPress={() => setEditing((e) => !e)}
        >
          <Icon
            icon={editing ? "solar:eye-linear" : "solar:pen-linear"}
            width={16}
          />
          {editing ? "Preview" : "Editar"}
        </Button>
        <Button
          color="primary"
          size="lg"
          onPress={handleApprove}
          isLoading={submitting}
          startContent={
            !submitting && (
              <Icon icon="solar:play-circle-linear" width={20} />
            )
          }
        >
          Aprovar & Gerar
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/projects/agent-plan-preview.tsx
git commit -m "feat: agent plan preview with edit and approve"
```

---

### Task 6: Update Generate Page — Add Tabs

**Files:**
- Modify: `src/app/(authenticated)/projects/[id]/generate/page.tsx`

**Step 1: Add tabs to switch between structured and agent modes**

Replace entire file:

```typescript
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BriefingForm } from "@/components/projects/briefing-form";
import { ReviewCards } from "@/components/projects/review-cards";
import { AgentForm } from "@/components/projects/agent-form";
import { AgentPlanPreview } from "@/components/projects/agent-plan-preview";
import type { ExtractedCreative } from "@/lib/schemas/briefing";

interface AgentPlan {
  templateSlug: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords: string[];
  reasoning: string;
}

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>();

  // Structured mode state
  const [creatives, setCreatives] = useState<ExtractedCreative[] | null>(null);

  // Agent mode state
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [refImageR2Key, setRefImageR2Key] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs
        aria-label="Generation mode"
        variant="underlined"
        color="primary"
      >
        <Tab
          key="structured"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:list-check-linear" width={18} />
              <span>Estruturado</span>
            </div>
          }
        >
          {!creatives ? (
            <BriefingForm projectId={id} onExtracted={setCreatives} />
          ) : (
            <ReviewCards projectId={id} initialCreatives={creatives} />
          )}
        </Tab>

        <Tab
          key="agent"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:magic-stick-3-linear" width={18} />
              <span>Agente</span>
            </div>
          }
        >
          {!agentPlan ? (
            <AgentForm
              projectId={id}
              onPlanReady={(plan, ref) => {
                setAgentPlan(plan);
                setRefImageR2Key(ref);
              }}
            />
          ) : (
            <AgentPlanPreview
              projectId={id}
              plan={agentPlan}
              refImageR2Key={refImageR2Key}
              onBack={() => setAgentPlan(null)}
            />
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
```

**Step 2: Verify dev server compiles**

Run: `bun dev` — open `/projects/{id}/generate`, verify both tabs render.

**Step 3: Commit**

```bash
git add src/app/\(authenticated\)/projects/\[id\]/generate/page.tsx
git commit -m "feat: add agent/structured tabs to generate page"
```

---

### Task 7: Ref Image Upload Support

**Files:**
- Modify: `src/components/projects/agent-form.tsx`
- Modify: `src/app/api/projects/[id]/jobs/[jobId]/process/route.ts`
- Modify: `src/app/api/projects/[id]/jobs/route.ts`
- Modify: `src/lib/schemas/job.ts`

**Step 1: Add refImageR2Key to job schema**

In `src/lib/schemas/job.ts`, add to `createJobSchema`:

```typescript
export const createJobSchema = z.object({
  templateId: z.string().min(1),
  headline: z.string().min(1),
  benefits: z.array(z.string()).max(5).optional(),
  ctaText: z.string().min(1),
  keywords: z.array(z.string()).max(5).optional(),
  refImageR2Key: z.string().optional(),
});
```

**Step 2: Add ref_image_r2_key column to jobs**

Create `drizzle/0003_ref_image.sql`:

```sql
ALTER TABLE jobs ADD COLUMN ref_image_r2_key TEXT;
```

Update `src/server/db/schema.ts` — add to jobs table:

```typescript
refImageR2Key: text("ref_image_r2_key"),
```

**Step 3: Save refImageR2Key in job creation**

In `src/app/api/projects/[id]/jobs/route.ts`, in the batch creation loop, add `refImageR2Key`:

```typescript
// line ~138, inside the db.insert(jobs).values({...})
refImageR2Key: jobInput.refImageR2Key ?? null,
```

**Step 4: Use ref image in process route**

In `src/app/api/projects/[id]/jobs/[jobId]/process/route.ts`, after the photo loading block (~line 131), add:

```typescript
// Add user-provided style reference image
if (job.ref_image_r2_key) {
  const refData = await fetchR2AsBase64(storage, job.ref_image_r2_key);
  if (refData) parts.push({ inline_data: refData });
}
```

**Step 5: Add upload UI to agent form**

In `src/components/projects/agent-form.tsx`, replace the `// TODO Task 6` comments with presigned URL upload (reuse existing upload pattern from the project if one exists, or add a simple file input that uploads to `/api/projects/{id}/refs`).

**Step 6: Run migration locally**

```bash
npx wrangler d1 execute creative-post-d1 --local --file=drizzle/0003_ref_image.sql
```

**Step 7: Commit**

```bash
git add src/lib/schemas/job.ts src/server/db/schema.ts drizzle/0003_ref_image.sql \
  src/app/api/projects/[id]/jobs/route.ts \
  src/app/api/projects/[id]/jobs/[jobId]/process/route.ts \
  src/components/projects/agent-form.tsx
git commit -m "feat: ref image support in jobs and agent form"
```

---

### Task 8: Add ANTHROPIC_API_KEY to CloudflareEnv

**Files:**
- Modify: `cloudflare-env.d.ts` (or wherever CloudflareEnv is defined)

**Step 1: Find and update the env type**

Search for `CloudflareEnv` interface and add:

```typescript
ANTHROPIC_API_KEY: string;
```

**Step 2: Commit**

```bash
git add cloudflare-env.d.ts
git commit -m "feat: add ANTHROPIC_API_KEY to CloudflareEnv type"
```

---

### Task 9: End-to-End Test

**No files to create — manual verification.**

**Step 1: Start dev server**

```bash
bun dev
```

**Step 2: Navigate to a project's generate page**

Open: `http://localhost:3000/projects/{project-id}/generate`

**Step 3: Test structured mode still works**

- Click "Estruturado" tab
- Paste a briefing → verify extraction works as before

**Step 4: Test agent mode**

- Click "Agente" tab
- Paste: "Quero um post sobre rinoplastia com resultado natural, mostrando benefícios do procedimento"
- Click "Planejar criativo"
- Wait ~10s for agent to respond
- Verify plan shows: template, headline, benefits, CTA, keywords, reasoning
- Click "Editar" — verify fields become editable
- Click "Aprovar & Gerar" — verify job is created and redirects to gallery

**Step 5: Verify job processes**

- In gallery, wait for job to complete
- Verify generated image appears

**Step 6: Final commit if any fixes needed**

```bash
git commit -m "fix: agent mode adjustments from e2e testing"
```
