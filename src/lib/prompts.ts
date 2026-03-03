import { DESIGN_PRINCIPLES } from "./design-principles";

interface PromptInput {
  templatePrompt: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords?: string[];
  palette: Record<string, string>;
  logoDescription?: string;
  promptInjection: string;
  photoDescription?: string;
  doctorName?: string;
  specialty?: string;
}

export function buildGenerationPrompt(input: PromptInput): string {
  let prompt = input.templatePrompt;
  const p = input.palette;

  const replacements: Record<string, string> = {
    "[DARK_BG_COLOR]": p.primaryDark ?? p.dark ?? "#2C2C2C",
    "[ACCENT_COLOR]": p.accent ?? "#B8964E",
    "[LIGHT_BG_COLOR]": p.backgroundLight ?? p.light ?? "#F5F0EB",
    "[TEXT_DARK_COLOR]": p.textDark ?? p.text ?? "#1A1A1A",
    "[TEXT_LIGHT_COLOR]": p.textLight ?? p.muted ?? "#E8E8E8",
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
    "[DOCTOR_NAME]": input.doctorName ?? "",
    "[SPECIALTY]": input.specialty ?? "",
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(key, value);
  }

  prompt += `\n\nDESIGN PRINCIPLES (apply to all elements):\n${DESIGN_PRINCIPLES}`;
  return prompt;
}
