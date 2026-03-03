import {
  extractedBriefingSchema,
  type ExtractedCreative,
} from "./schemas/briefing";

function getApiKey(): string {
  let apiKey: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = eval("require")("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    apiKey = (env as CloudflareEnv).OPENROUTER_API_KEY;
  } catch {
    // not in cloudflare context
  }
  apiKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  return apiKey;
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
  const apiKey = getApiKey();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "minimax/minimax-m2.5",
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Project: ${opts.projectName}
${opts.specialty ? `Specialty: ${opts.specialty}` : ""}

Briefing:
${opts.inputText}

Extract all creatives as JSON.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const text = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  const parsed = JSON.parse(cleaned);
  const validated = extractedBriefingSchema.parse(parsed);
  return validated.creatives;
}
