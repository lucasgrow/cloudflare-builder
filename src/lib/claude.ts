import Anthropic from "@anthropic-ai/sdk";
import {
  extractedBriefingSchema,
  type ExtractedCreative,
} from "./schemas/briefing";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    let apiKey: string | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const { env } = getCloudflareContext();
      apiKey = (env as CloudflareEnv).OPENROUTER_API_KEY;
    } catch {
      // not in cloudflare context
    }
    apiKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    _client = new Anthropic({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }
  return _client;
}

const SYSTEM_PROMPT = `You extract structured ad creative specs from medical marketing briefings.
Given a briefing text and project context, extract individual creatives.
Each creative needs: headline, benefits (3 max), CTA text, keywords (1-2), suggested template.
Templates available: checklist-split, centralizado, checklist-clean, checklist-dark, half-half, card-foto.
Output ONLY valid JSON matching this schema, no markdown fences:
{ "creatives": [{ "headline": string, "benefits": string[], "ctaText": string, "keywords": string[], "suggestedTemplate": string }] }
PT-BR text. Keep headlines short (max 8 words). Benefits 4-7 words each.`;

export async function extractBriefing(opts: {
  inputText: string;
  projectName: string;
  specialty?: string;
}): Promise<ExtractedCreative[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "minimax/minimax-m1-80k",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Project: ${opts.projectName}
${opts.specialty ? `Specialty: ${opts.specialty}` : ""}

Briefing:
${opts.inputText}

Extract all creatives as JSON.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const validated = extractedBriefingSchema.parse(parsed);
  return validated.creatives;
}
