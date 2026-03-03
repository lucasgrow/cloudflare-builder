import Anthropic from "@anthropic-ai/sdk";
import {
  extractedBriefingSchema,
  type ExtractedCreative,
} from "./schemas/briefing";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    // Try cloudflare env first, then process.env
    let apiKey: string | undefined;
    try {
      const { getCloudflareContext } = require("@opennextjs/cloudflare");
      const { env } = getCloudflareContext();
      apiKey = (env as CloudflareEnv).ANTHROPIC_API_KEY;
    } catch {
      // not in cloudflare context
    }
    _client = new Anthropic(apiKey ? { apiKey } : undefined);
  }
  return _client;
}

export async function extractBriefing(opts: {
  inputText: string;
  projectName: string;
  specialty?: string;
}): Promise<ExtractedCreative[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You extract structured ad creative specs from medical marketing briefings.
Given a briefing text and project context, extract individual creatives.
Each creative needs: headline, benefits (3 max), CTA text, keywords (1-2), suggested template.
Templates available: checklist-split, centralizado, checklist-clean, checklist-dark, half-half, card-foto.
Output ONLY valid JSON matching this schema, no markdown fences:
{ "creatives": [{ "headline": string, "benefits": string[], "ctaText": string, "keywords": string[], "suggestedTemplate": string }] }
PT-BR text. Keep headlines short (max 8 words). Benefits 4-7 words each.`,
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
