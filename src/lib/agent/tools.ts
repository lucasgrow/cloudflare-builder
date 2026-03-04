import type { ToolDefinition, ToolHandler } from "./loop";

export interface AgentContext {
  db: D1Database;
  projectId: string;
}

// Keep in sync with process/route.ts when adding new templates
const DARK_BG_STYLES = [
  "checklist-split",
  "checklist-dark",
  "centralizado",
];

const PHOTO_STYLES = [
  "checklist-split",
  "checklist-clean",
  "half-half",
  "card-foto",
];

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "get_brand_config",
    description:
      "Fetch the project's brand configuration: palette, typography, logo description, prompt injection, and which assets (logo_dark, logo_light, photo) exist in storage.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "list_templates",
    description:
      "List all available non-custom templates with their slug, name, and layout description.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_template_prompt",
    description:
      "Get the full prompt_template and layout_description for a specific template by slug.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: {
          type: "string",
          description: "The slug of the template to fetch.",
        },
      },
      required: ["templateSlug"],
    },
  },
  {
    name: "select_assets",
    description:
      "Check which assets (logo variant, photo, style references) are available for the project given a chosen template slug. Returns the appropriate logo variant and whether photo/refs exist.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: {
          type: "string",
          description: "The slug of the selected template.",
        },
      },
      required: ["templateSlug"],
    },
  },
  {
    name: "submit_plan",
    description:
      "Submit the final creative plan. This is the last tool call — it locks in the template, copy, and reasoning.",
    input_schema: {
      type: "object",
      properties: {
        templateSlug: {
          type: "string",
          description: "Slug of the chosen template.",
        },
        headline: {
          type: "string",
          description: "Headline text, max 8 words, PT-BR.",
        },
        benefits: {
          type: "array",
          items: { type: "string" },
          description:
            "Up to 3 benefit lines, 4-7 words each. Optional for templates without checklist.",
        },
        ctaText: {
          type: "string",
          description: "Action-oriented CTA text.",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "1-2 keywords extracted from the headline.",
        },
        reasoning: {
          type: "string",
          description:
            "Brief reasoning for template choice and copy decisions.",
        },
      },
      required: ["templateSlug", "headline", "ctaText", "keywords", "reasoning"],
    },
  },
];

export function createToolHandlers(
  ctx: AgentContext
): Record<string, ToolHandler> {
  const { db, projectId } = ctx;

  return {
    get_brand_config: async () => {
      const row = await db
        .prepare(
          `SELECT palette_json, typography_json, logo_description, prompt_injection,
                  logo_dark_r2_key, logo_light_r2_key, photo_r2_key
           FROM projects WHERE id = ?`
        )
        .bind(projectId)
        .first();

      if (!row) return JSON.stringify({ error: "project not found" });

      return JSON.stringify({
        palette: JSON.parse((row.palette_json as string) || "{}"),
        typography: JSON.parse((row.typography_json as string) || "{}"),
        logoDescription: row.logo_description || null,
        promptInjection: row.prompt_injection || null,
        hasLogoDark: !!row.logo_dark_r2_key,
        hasLogoLight: !!row.logo_light_r2_key,
        hasPhoto: !!row.photo_r2_key,
      });
    },

    list_templates: async () => {
      const { results } = await db
        .prepare(
          `SELECT slug, name, layout_description FROM templates WHERE is_custom = 0`
        )
        .all();

      return JSON.stringify(
        (results || []).map((r) => ({
          slug: r.slug,
          name: r.name,
          layout: r.layout_description,
        }))
      );
    },

    get_template_prompt: async (input) => {
      const slug = input.templateSlug as string;
      const row = await db
        .prepare(
          `SELECT prompt_template, layout_description FROM templates WHERE slug = ?`
        )
        .bind(slug)
        .first();

      if (!row) return JSON.stringify({ error: `template "${slug}" not found` });

      return JSON.stringify({
        promptTemplate: row.prompt_template,
        layoutDescription: row.layout_description,
      });
    },

    select_assets: async (input) => {
      const slug = input.templateSlug as string;
      const isDark = DARK_BG_STYLES.includes(slug);
      const needsPhoto = PHOTO_STYLES.includes(slug);

      // Get project assets
      const project = await db
        .prepare(
          `SELECT logo_dark_r2_key, logo_light_r2_key, photo_r2_key FROM projects WHERE id = ?`
        )
        .bind(projectId)
        .first();

      if (!project) return JSON.stringify({ error: "project not found" });

      // Pick logo variant: dark-bg styles prefer light logo, light-bg prefer dark
      const preferredLogo = isDark
        ? project.logo_light_r2_key || project.logo_dark_r2_key
        : project.logo_dark_r2_key || project.logo_light_r2_key;

      // Get style refs
      const { results: refs } = await db
        .prepare(
          `SELECT r2_key, type, label FROM project_refs WHERE project_id = ?`
        )
        .bind(projectId)
        .all();

      return JSON.stringify({
        logoKey: preferredLogo || null,
        photoKey: needsPhoto ? project.photo_r2_key || null : null,
        needsPhoto,
        hasPhoto: !!project.photo_r2_key,
        styleRefs: (refs || []).filter((r) => r.type === "style_ref"),
      });
    },

    submit_plan: async (input) => {
      return JSON.stringify(input);
    },
  };
}
