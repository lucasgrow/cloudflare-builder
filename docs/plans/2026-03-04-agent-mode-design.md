# Agent Mode — Creative Post Generation

## Goal

Add "Agente" mode to `/projects/{id}/generate` that works like the `/creative-post` skill: user provides free text, Claude Sonnet analyzes it, picks template, structures copy, builds prompt. Human reviews plan before generation. Coexists with current structured mode.

## Architecture

Manual tool-use loop with `@anthropic-ai/sdk` on Cloudflare Workers (no Agent SDK — requires Node.js).

```
Frontend (agent tab)
  │ POST /api/projects/{id}/agent/plan
  │ body: { freeText, refImageR2Key? }
  ▼
API Route — tool-use loop (max 6 turns, Claude Sonnet)
  │ Tools: get_brand_config, list_templates, get_template_prompt,
  │        select_assets, build_prompt
  │ Returns: { plan: { template, headline, benefits, cta, keywords, reasoning } }
  ▼
Frontend (plan preview)
  │ Human reviews/edits, approves
  │ POST /api/projects/{id}/jobs (existing)
  ▼
Existing pipeline (no changes)
  │ Create job → waitUntil → process → Gemini → R2 → done
  ▼
Gallery (existing)
```

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `get_brand_config` | projectId | Palette, typography, logo descriptions, prompt injection |
| `list_templates` | — | Slugs, names, descriptions, layout summaries |
| `get_template_prompt` | templateSlug | Full prompt template + layout description |
| `select_assets` | templateSlug, projectId | Available assets (logo, photo, style refs) |
| `build_prompt` | { templateSlug, headline, benefits?, cta, keywords, freeTextAppend? } | Final prompt with all substitutions |

Agent does NOT generate images. It only plans. Generation stays in existing pipeline.

## System Prompt

Agent is a copywriter that picks a frame, not a designer that creates layouts. Templates handle all visual specs (font sizes, positions, colors). Agent:

1. Calls `get_brand_config` — understands client identity
2. Calls `list_templates` — sees the 6 options
3. Analyzes brief tone/content
4. Picks best template (tone → layout mapping)
5. Structures copy: headline (max 8 words PT-BR), benefits (3 max, 4-7 words), CTA, keywords (1-2 for accent)
6. Calls `build_prompt` with structured output
7. Returns plan with reasoning

Template selection guide:
- Benefit-driven/educational → checklist-split
- Single focus, high impact → centralizado
- Soft/lifestyle/wellness → checklist-clean
- Text-heavy, no photo → checklist-dark
- Emotional/sensitive → half-half
- Aspirational/results → card-foto

## UX

Generate page gets tabs: `[Estruturado] [Agente ✨]`

**Agent tab:** Textarea (min 10 chars) + optional ref image upload + "Planejar criativo" button.

**Plan preview:** Shows template (with thumbnail), headline, benefits, CTA, keywords, reasoning. Buttons: "Editar" (opens fields) / "Aprovar e Gerar" (creates job).

## New Files

| File | Purpose |
|------|---------|
| `src/lib/agent/loop.ts` | Generic tool-use loop (Anthropic SDK) |
| `src/lib/agent/tools.ts` | 5 tool definitions + handlers |
| `src/app/api/projects/[id]/agent/plan/route.ts` | API route — runs agent |
| `src/components/projects/agent-form.tsx` | Free text input + ref upload |
| `src/components/projects/agent-plan-preview.tsx` | Plan review UI |

## Modified Files

| File | Change |
|------|--------|
| `generate/page.tsx` | Add tabs (structured/agent), render agent components |
| `process/route.ts` | Accept refImageR2Key, add as Gemini inline_data |

## Ref Image Flow

Upload via presigned URL → R2. Pass key in job payload. In `process/route.ts`, if `refImageR2Key` exists, fetch from R2, add as inline_data with instruction "Use as visual style reference".

## Constraints

- **Max turns:** 6 (safety limit, expect 2-3 in practice)
- **Model:** Claude Sonnet 4.6
- **Cost:** ~$0.01-0.02 per plan
- **Latency:** ~8-12s for plan (acceptable — human reviews after)
- **ANTHROPIC_API_KEY** needed in `.dev.vars` / CF secrets
