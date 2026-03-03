# Creative Post — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Web app for producing branded static ad creatives for medical clients — onboard projects, paste briefings, AI extracts copies, batch generate via Gemini, refine interactively.

**Architecture:** Next.js on Cloudflare Pages (opennextjs-cloudflare) with D1, R2, and Queues. Anthropic SDK for briefing extraction (Claude), Gemini API for image generation. Single-app structure (no monorepo) — Queue consumer runs as a separate Worker in the same wrangler config.

**Tech Stack:** Next.js 14 (App Router), Drizzle ORM + D1, R2 presigned uploads, Cloudflare Queues, @anthropic-ai/sdk, Gemini 3 Pro Image Preview, HeroUI + Tailwind, Zod.

**Design Doc:** `docs/plans/2026-03-03-creative-post-phase-b-design.md`

---

## Key Decisions (deviations from design doc)

1. **No monorepo/Turborepo** — template is flat Next.js app, no need to restructure. Queue consumer worker lives in `src/workers/generator/` and gets a separate wrangler config (`wrangler.worker.toml`).

2. **Anthropic SDK, not Agent SDK** — briefing extraction is structured text→JSON. Agent SDK needs Node.js runtime (file system, shell) which Workers don't support. Use `@anthropic-ai/sdk` with `tool_use` for structured extraction. Same result, actually deployable.

3. **Auth: keep Google + magic link** — design says "email + senha" but template already has Google + Resend magic link which is better UX and more secure. No credentials provider needed for MVP.

4. **No dedicated `packages/shared/`** — types and validation live in `src/lib/schemas/`. Shared between app and worker via import.

5. **Click-to-edit: descriptive prompt only (no bounding box)** — Gemini doesn't support region-specific edits. Send original image + text instruction. Bounding box UI deferred post-MVP.

---

## Tree

```
src/
 ├── UPDATE server/db/schema.ts (major) — add 5 tables
 ├── NEW lib/schemas/project.ts — Zod schemas
 ├── NEW lib/schemas/job.ts
 ├── NEW lib/schemas/briefing.ts
 ├── NEW lib/schemas/template.ts
 ├── UPDATE lib/r2.ts (minor) — add getSignedUrl for reading
 ├── NEW lib/queue.ts — enqueue helper
 ├── NEW lib/claude.ts — briefing extraction
 ├── NEW lib/gemini.ts — image generation
 ├── NEW lib/prompts.ts — prompt building (from Phase A)
 ├── NEW app/(authenticated)/projects/page.tsx — list
 ├── NEW app/(authenticated)/projects/new/page.tsx — onboarding wizard
 ├── NEW app/(authenticated)/projects/[id]/page.tsx — detail
 ├── NEW app/(authenticated)/projects/[id]/generate/page.tsx — briefing + review
 ├── NEW app/(authenticated)/projects/[id]/gallery/page.tsx — outputs + edit
 ├── NEW app/api/projects/route.ts — list + create
 ├── NEW app/api/projects/[id]/route.ts — get + update
 ├── NEW app/api/projects/[id]/briefings/route.ts — create + extract
 ├── NEW app/api/projects/[id]/jobs/route.ts — list + create batch
 ├── NEW app/api/projects/[id]/jobs/[jobId]/route.ts — get status
 ├── UPDATE app/(authenticated)/layout-client.tsx (minor) — sidebar items
 ├── UPDATE wrangler.toml (minor) — add queue binding
 ├── NEW wrangler.worker.toml — generator worker config
 ├── NEW src/workers/generator/index.ts — queue consumer
 ├── NEW src/workers/generator/generate.ts — gemini pipeline
drizzle/
 ├── NEW 0002_creative_post.sql — migration
```

---

## Task 1: Database Schema

**Files:**
- Modify: `src/server/db/schema.ts`
- Create: `drizzle/0002_creative_post.sql`

**Step 1: Add Drizzle schema tables**

Add to `src/server/db/schema.ts` after existing tables:

```ts
// --- Creative Post tables ---

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => `prj_${crypto.randomUUID()}`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  paletteJson: text("palette_json").notNull(),
  typographyJson: text("typography_json").notNull(),
  logoDescription: text("logo_description"),
  promptInjection: text("prompt_injection").notNull(),
  logoDarkR2Key: text("logo_dark_r2_key"),
  logoLightR2Key: text("logo_light_r2_key"),
  photoR2Key: text("photo_r2_key"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const projectRefs = sqliteTable("project_refs", {
  id: text("id").primaryKey().$defaultFn(() => `prf_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  r2Key: text("r2_key").notNull(),
  type: text("type").notNull(), // 'style_ref' | 'extra_photo'
  label: text("label"),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey().$defaultFn(() => `tpl_${crypto.randomUUID()}`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  promptTemplate: text("prompt_template").notNull(),
  layoutDescription: text("layout_description"),
  isCustom: integer("is_custom").default(0),
  projectId: text("project_id").references(() => projects.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey().$defaultFn(() => `job_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  templateId: text("template_id").notNull().references(() => templates.id),
  headline: text("headline").notNull(),
  benefitsJson: text("benefits_json"),
  ctaText: text("cta_text").notNull(),
  keywordsJson: text("keywords_json"),
  status: text("status").notNull().default("queued"), // queued | processing | done | failed
  errorMessage: text("error_message"),
  outputR2Key: text("output_r2_key"),
  parentJobId: text("parent_job_id"),
  editPrompt: text("edit_prompt"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
});

export const briefings = sqliteTable("briefings", {
  id: text("id").primaryKey().$defaultFn(() => `brf_${crypto.randomUUID()}`),
  projectId: text("project_id").notNull().references(() => projects.id),
  inputText: text("input_text").notNull(),
  extractedJson: text("extracted_json"),
  status: text("status").default("pending"), // pending | processed | approved
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
```

**Step 2: Generate migration**

Run: `cd /Users/lfari/Projects/creative-post && bun run db:generate`
Expected: Creates `drizzle/0002_creative_post.sql` with CREATE TABLE statements.

**Step 3: Apply migration locally**

Run: `bun run db:migrate:dev`
Expected: Migration applied, tables created in local D1.

**Step 4: Seed default templates**

Create `scripts/seed-templates.ts`:

```ts
// 6 templates from Phase A styles: checklist-split, centralizado,
// checklist-clean, checklist-dark, half-half, card-foto
// Each with prompt_template from ~/.claude/skills/creative-post/styles/{slug}.md
// Run: bun run scripts/seed-templates.ts
```

Port the Gemini prompt templates from Phase A skill files (`~/.claude/skills/creative-post/styles/*.md`) into the seed script as `prompt_template` text.

Run: `bun run scripts/seed-templates.ts`

**Step 5: Commit**

```bash
git add src/server/db/schema.ts drizzle/ scripts/seed-templates.ts
git commit -m "feat: add creative-post schema + seed 6 templates"
```

---

## Task 2: Zod Schemas & Shared Types

**Files:**
- Create: `src/lib/schemas/project.ts`
- Create: `src/lib/schemas/job.ts`
- Create: `src/lib/schemas/briefing.ts`

**Step 1: Create project schema**

```ts
// src/lib/schemas/project.ts
import { z } from "zod";

export const paletteSchema = z.object({
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  dark: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  light: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  muted: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const typographySchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  palette: paletteSchema,
  typography: typographySchema,
  logoDescription: z.string().optional(),
  promptInjection: z.string().min(1),
});
```

**Step 2: Create job schema**

```ts
// src/lib/schemas/job.ts
import { z } from "zod";

export const createJobSchema = z.object({
  templateId: z.string().min(1),
  headline: z.string().min(1),
  benefits: z.array(z.string()).max(5).optional(),
  ctaText: z.string().min(1),
  keywords: z.array(z.string()).max(5).optional(),
});

export const createBatchJobsSchema = z.object({
  jobs: z.array(createJobSchema).min(1).max(20),
});

export const createEditJobSchema = z.object({
  parentJobId: z.string().min(1),
  editPrompt: z.string().min(1),
});
```

**Step 3: Create briefing schema**

```ts
// src/lib/schemas/briefing.ts
import { z } from "zod";

export const createBriefingSchema = z.object({
  inputText: z.string().min(10).max(10000),
});

// Shape returned by Claude extraction
export const extractedCreativeSchema = z.object({
  headline: z.string(),
  benefits: z.array(z.string()).max(5),
  ctaText: z.string(),
  keywords: z.array(z.string()).max(5),
  suggestedTemplate: z.string(),
});

export const extractedBriefingSchema = z.object({
  creatives: z.array(extractedCreativeSchema),
});
```

**Step 4: Commit**

```bash
git add src/lib/schemas/
git commit -m "feat: add Zod validation schemas"
```

---

## Task 3: R2 Helpers + Queue Helper

**Files:**
- Modify: `src/lib/r2.ts` (minor — add read URL helper)
- Create: `src/lib/queue.ts`

**Step 1: Add R2 read helper**

Add to `src/lib/r2.ts`:

```ts
export async function generatePresignedReadUrl(opts: {
  key: string;
  expiresIn?: number;
}): Promise<string> {
  // Same signing logic as upload but with GET method
  // Returns signed GET URL for serving images from R2
}

export function getProjectAssetKey(projectId: string, filename: string, type: "logo-dark" | "logo-light" | "photo" | "extra" | "ref" | "output"): string {
  const prefixes: Record<string, string> = {
    "logo-dark": `projects/${projectId}/assets/logo-dark`,
    "logo-light": `projects/${projectId}/assets/logo-light`,
    "photo": `projects/${projectId}/assets/photo-professional`,
    "extra": `projects/${projectId}/assets/extra/${filename}`,
    "ref": `projects/${projectId}/refs/${filename}`,
    "output": `projects/${projectId}/outputs/${filename}`,
  };
  return prefixes[type] ?? `projects/${projectId}/${filename}`;
}
```

**Step 2: Create queue helper**

```ts
// src/lib/queue.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface GenerationJob {
  jobId: string;
  projectId: string;
  templateId: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords?: string[];
  parentJobId?: string;
  editPrompt?: string;
}

export async function enqueueJob(job: GenerationJob) {
  const { env } = await getCloudflareContext();
  const queue = env.GENERATION_QUEUE as Queue<GenerationJob>;
  await queue.send(job);
}
```

**Step 3: Run `bun check` (typecheck)**

Run: `cd /Users/lfari/Projects/creative-post && bunx tsc --noEmit`
Expected: No errors (queue binding type needs env.d.ts update — see step 4).

**Step 4: Update env.d.ts for queue binding**

Add `GENERATION_QUEUE: Queue` to the Cloudflare env interface in `env.d.ts`.

**Step 5: Commit**

```bash
git add src/lib/r2.ts src/lib/queue.ts env.d.ts
git commit -m "feat: add R2 read URLs + queue enqueue helper"
```

---

## Task 4: Briefing Extraction (Claude)

**Files:**
- Create: `src/lib/claude.ts`

**Step 1: Install Anthropic SDK**

Run: `cd /Users/lfari/Projects/creative-post && bun add @anthropic-ai/sdk`

**Step 2: Write extraction function**

```ts
// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { extractedBriefingSchema, type ExtractedCreative } from "./schemas/briefing";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function extractBriefing(opts: {
  inputText: string;
  projectName: string;
  specialty?: string;
}): Promise<ExtractedCreative[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You extract structured ad creative specs from medical marketing briefings.
Given a briefing text and project context, extract individual creatives.
Each creative needs: headline, benefits (3 max), CTA text, keywords (1-2), suggested template.
Templates available: checklist-split, centralizado, checklist-clean, checklist-dark, half-half, card-foto.
Output valid JSON matching the schema. PT-BR text.`,
    messages: [{
      role: "user",
      content: `Project: ${opts.projectName}
${opts.specialty ? `Specialty: ${opts.specialty}` : ""}

Briefing:
${opts.inputText}

Extract all creatives as JSON: { "creatives": [...] }`
    }],
  });

  const text = response.content.find(b => b.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text);
  const validated = extractedBriefingSchema.parse(parsed);
  return validated.creatives;
}
```

**Step 3: Add ANTHROPIC_API_KEY to .dev.vars**

Add `ANTHROPIC_API_KEY=sk-ant-...` to `.dev.vars`.

**Step 4: Commit**

```bash
git add src/lib/claude.ts .dev.vars.example
git commit -m "feat: add Claude briefing extraction"
```

---

## Task 5: Prompt Building (from Phase A)

**Files:**
- Create: `src/lib/prompts.ts`
- Create: `src/lib/design-principles.ts`

**Step 1: Port design principles**

Copy `~/.claude/skills/creative-post/design-principles.md` content into a TS constant:

```ts
// src/lib/design-principles.ts
export const DESIGN_PRINCIPLES = `...full text from design-principles.md...`;
```

**Step 2: Write prompt builder**

Port the Phase A variable substitution logic:

```ts
// src/lib/prompts.ts
import { DESIGN_PRINCIPLES } from "./design-principles";

interface PromptInput {
  templatePrompt: string;      // from templates table
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords?: string[];
  palette: { accent: string; dark: string };
  logoDescription?: string;
  promptInjection: string;
  photoDescription?: string;
}

export function buildGenerationPrompt(input: PromptInput): string {
  let prompt = input.templatePrompt;

  const replacements: Record<string, string> = {
    "[DARK_BG_COLOR]": input.palette.dark,
    "[ACCENT_COLOR]": input.palette.accent,
    "[HEADLINE]": input.headline,
    "[BENEFIT_1]": input.benefits?.[0] ?? "",
    "[BENEFIT_2]": input.benefits?.[1] ?? "",
    "[BENEFIT_3]": input.benefits?.[2] ?? "",
    "[CTA_TEXT]": input.ctaText,
    "[KEYWORD_1]": input.keywords?.[0] ?? "",
    "[KEYWORD_2]": input.keywords?.[1] ?? "",
    "[LOGO_INSTRUCTION]": input.logoDescription ?? "",
    "[BRAND_PROMPT_INJECTION]": input.promptInjection,
    "[PHOTO_DESCRIPTION]": input.photoDescription ?? "",
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(key, value);
  }

  prompt += `\n\nDESIGN PRINCIPLES (apply to all elements):\n${DESIGN_PRINCIPLES}`;
  return prompt;
}
```

**Step 3: Commit**

```bash
git add src/lib/prompts.ts src/lib/design-principles.ts
git commit -m "feat: add prompt builder from Phase A"
```

---

## Task 6: API Routes — Projects CRUD

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`

**Step 1: List + Create projects**

```ts
// src/app/api/projects/route.ts
// GET: list projects for current user
// POST: create project (validate with createProjectSchema)
// Both auth-gated via auth()
```

Standard pattern from template: `auth()` check → `getDb()` → Drizzle query → `NextResponse.json()`.

**Step 2: Get + Update project**

```ts
// src/app/api/projects/[id]/route.ts
// GET: single project with refs count
// PATCH: update project fields
```

**Step 3: Briefing API**

```ts
// src/app/api/projects/[id]/briefings/route.ts
// POST: create briefing → call extractBriefing() → save extracted_json → return
// GET: list briefings for project
```

**Step 4: Jobs API**

```ts
// src/app/api/projects/[id]/jobs/route.ts
// POST: create batch jobs from approved briefing → enqueue each → return job IDs
// GET: list jobs for project (gallery data)

// src/app/api/projects/[id]/jobs/[jobId]/route.ts
// GET: single job status + output URL
```

**Step 5: Verify routes compile**

Run: `bunx tsc --noEmit`

**Step 6: Commit**

```bash
git add src/app/api/projects/
git commit -m "feat: add projects/briefings/jobs API routes"
```

---

## Task 7: UI — Projects List + Sidebar

**Files:**
- Create: `src/app/(authenticated)/projects/page.tsx`
- Modify: `src/app/(authenticated)/layout-client.tsx`

**Step 1: Projects list page**

Server component. Fetch projects from API. Display as cards grid with name, slug, created date. "New Project" button.

**Step 2: Update sidebar**

Add to `sidebarItems` in `layout-client.tsx`:

```ts
{ key: "projects", href: "/projects", icon: "solar:folder-linear", title: "Projects" },
```

Add breadcrumb labels for `/projects`, `/projects/new`, `/projects/[id]/*`.

**Step 3: Verify in browser**

Run: `bun dev` → navigate to `/projects` → should see empty state + "New Project" button.

**Step 4: Commit**

```bash
git add src/app/(authenticated)/projects/page.tsx src/app/(authenticated)/layout-client.tsx
git commit -m "feat: add projects list page + sidebar nav"
```

---

## Task 8: UI — Project Onboarding Wizard

**Files:**
- Create: `src/app/(authenticated)/projects/new/page.tsx`
- Create: `src/components/projects/onboarding-wizard.tsx`

Multi-step form (client component):

1. **Basics**: name, slug (auto-generate from name)
2. **Assets**: upload logo dark/light, professional photo → presigned R2 uploads
3. **Visual Identity**: color pickers for palette (accent, dark, light, text, muted), font dropdowns
4. **Prompt Injection**: auto-generated textarea from fields (editable)
5. **Style Refs**: upload 2-3 reference images → R2
6. **Review**: preview all fields → submit

Each step validates before advancing. Final submit POSTs to `/api/projects`.

**Step 1: Create wizard skeleton with step navigation**

**Step 2: Implement step 1 (basics) + step 2 (asset uploads)**

Asset uploads use the existing presigned upload flow from the template.

**Step 3: Implement step 3 (palette + typography) + step 4 (prompt injection)**

Auto-generate prompt injection from palette + logo description + typography using a template string (same structure as `brand.md` Prompt Injection Pattern from Phase A).

**Step 4: Implement step 5 (refs) + step 6 (review + submit)**

**Step 5: Test full wizard flow in browser**

**Step 6: Commit**

```bash
git add src/app/(authenticated)/projects/new/ src/components/projects/
git commit -m "feat: add project onboarding wizard"
```

---

## Task 9: UI — Briefing + Review Cards

**Files:**
- Create: `src/app/(authenticated)/projects/[id]/generate/page.tsx`
- Create: `src/components/projects/briefing-form.tsx`
- Create: `src/components/projects/review-cards.tsx`

**Step 1: Briefing form**

Textarea for raw briefing text. "Process" button → POST to briefings API → Claude extracts → returns structured creatives.

**Step 2: Review cards**

Render extracted creatives as editable cards. Each card has:
- Headline (textarea)
- Benefits (3 inputs)
- CTA (input)
- Keywords (tag input)
- Template (dropdown with 6 options)
- Remove button

Add/remove cards. "Approve & Generate" button → POST batch jobs → redirect to gallery.

**Step 3: Test full flow: paste briefing → extract → edit cards → approve**

**Step 4: Commit**

```bash
git add src/app/(authenticated)/projects/[id]/generate/ src/components/projects/briefing-form.tsx src/components/projects/review-cards.tsx
git commit -m "feat: add briefing extraction + review cards UI"
```

---

## Task 10: Cloudflare Queue + Generator Worker

**Files:**
- Modify: `wrangler.toml` — add queue binding
- Create: `wrangler.worker.toml` — generator worker config
- Create: `src/workers/generator/index.ts`
- Create: `src/workers/generator/generate.ts`

**Step 1: Add queue binding to wrangler.toml**

```toml
[[queues.producers]]
binding = "GENERATION_QUEUE"
queue = "creative-post-jobs"

# Consumer is in separate worker
```

**Step 2: Create generator worker config**

```toml
# wrangler.worker.toml
name = "creative-post-generator"
main = "src/workers/generator/index.ts"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat"]

[[queues.consumers]]
queue = "creative-post-jobs"
max_batch_size = 1
max_retries = 2

[[d1_databases]]
binding = "DATABASE"
database_name = "creative-post-d1"
database_id = "{{D1_DATABASE_ID}}"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "creative-post-storage"
```

**Step 3: Write queue consumer entry**

```ts
// src/workers/generator/index.ts
import { generateCreative } from "./generate";

export default {
  async queue(batch: MessageBatch<GenerationJob>, env: Env) {
    for (const msg of batch.messages) {
      try {
        await generateCreative(msg.body, env);
        msg.ack();
      } catch (e) {
        msg.retry();
      }
    }
  },
};
```

**Step 4: Write generation pipeline**

```ts
// src/workers/generator/generate.ts
// 1. Load project config from D1
// 2. Load template prompt from D1
// 3. Fetch assets from R2 (logo, photo, refs) → base64
// 4. Build prompt via buildGenerationPrompt()
// 5. Call Gemini API with text + inline_data images
// 6. Save output image to R2
// 7. Update job status in D1 (done/failed)
```

Port the Gemini API call from Phase A skill (steps 4-6 of SKILL.md): build `contents[].parts[]` with text prompt + `inline_data` images, POST to `generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent`.

**Step 5: Add scripts to package.json**

```json
"worker:dev": "wrangler dev --config wrangler.worker.toml",
"worker:deploy": "wrangler deploy --config wrangler.worker.toml"
```

**Step 6: Test locally**

Run: `bun run worker:dev` → send test message to queue → verify image appears in R2.

**Step 7: Commit**

```bash
git add wrangler.toml wrangler.worker.toml src/workers/ package.json
git commit -m "feat: add queue consumer + Gemini generation worker"
```

---

## Task 11: UI — Gallery

**Files:**
- Create: `src/app/(authenticated)/projects/[id]/gallery/page.tsx`
- Create: `src/components/projects/gallery-grid.tsx`
- Create: `src/components/projects/creative-viewer.tsx`

**Step 1: Gallery grid**

Server component fetches jobs for project. Client component renders grid of output images with status badges (queued/processing/done/failed).

**Step 2: Polling for in-progress jobs**

Client-side: poll `/api/projects/[id]/jobs` every 5s while any job has status `queued` or `processing`. Stop polling when all done/failed.

**Step 3: Creative viewer modal**

Click image → fullscreen modal with:
- Full-size image (from R2 signed URL)
- Download button
- "Edit" button → opens edit form

**Step 4: Edit form**

Text input for edit instruction (e.g., "headline maior", "CTA em verde"). Submit → creates new job with `parentJobId` + `editPrompt` → enqueues → new version appears in gallery.

**Step 5: Test full flow: generate → poll → view → download → edit**

**Step 6: Commit**

```bash
git add src/app/(authenticated)/projects/[id]/gallery/ src/components/projects/gallery-grid.tsx src/components/projects/creative-viewer.tsx
git commit -m "feat: add gallery with polling + edit flow"
```

---

## Task 12: Project Detail Page + Navigation

**Files:**
- Create: `src/app/(authenticated)/projects/[id]/page.tsx`
- Create: `src/app/(authenticated)/projects/[id]/layout.tsx`

**Step 1: Project layout with sub-navigation**

Tabs or sub-nav: Overview | Generate | Gallery. Fetches project by ID, passes to children.

**Step 2: Project detail/overview page**

Shows project config summary: name, palette preview, asset thumbnails, template count, job stats (total/done/failed).

**Step 3: Commit**

```bash
git add src/app/(authenticated)/projects/[id]/page.tsx src/app/(authenticated)/projects/[id]/layout.tsx
git commit -m "feat: add project detail page + sub-navigation"
```

---

## Task 13: Wiring + Environment + Deploy

**Step 1: Update .dev.vars.example with new vars**

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

**Step 2: Update env.ts Zod schema**

Add `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` to env validation.

**Step 3: Create Cloudflare Queue**

Run: `wrangler queues create creative-post-jobs`

**Step 4: Deploy app + worker**

Run: `bun run deploy && bun run worker:deploy`

**Step 5: Test E2E in production**

1. Login → Create project → Upload assets → Set palette
2. Go to Generate → Paste briefing → Process → Review cards → Approve
3. Go to Gallery → Watch polling → Download output → Edit

**Step 6: Commit**

```bash
git add .dev.vars.example src/env.ts
git commit -m "feat: wire env vars + deploy config"
```

---

## Unresolved

- Gemini image generation in Workers: response can be large (2K image). Workers has 128MB memory limit — should be fine but monitor.
- `opennextjs-cloudflare` + Queue producer: verify `getCloudflareContext()` exposes queue bindings. If not, use service binding from worker to app.
- Template prompt migration: need to manually port all 6 style prompts from Phase A skill files. Consider a script that reads `~/.claude/skills/creative-post/styles/*.md` and extracts the Gemini Prompt Template block.
- Local dev queue testing: `wrangler dev` supports queues locally but may need `--experimental-queues` flag.
