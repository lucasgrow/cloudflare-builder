import { DESIGN_PRINCIPLES } from "./design-principles";

interface PromptInput {
  templatePrompt: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords?: string[];
  palette: { accent: string; dark: string; light?: string; text?: string; muted?: string };
  logoDescription?: string;
  promptInjection: string;
  photoDescription?: string;
  doctorName?: string;
  specialty?: string;
}

export function buildGenerationPrompt(input: PromptInput): string {
  let prompt = input.templatePrompt;

  const replacements: Record<string, string> = {
    "[DARK_BG_COLOR]": input.palette.dark,
    "[ACCENT_COLOR]": input.palette.accent,
    "[LIGHT_BG_COLOR]": input.palette.light ?? "#F5F0EB",
    "[TEXT_DARK_COLOR]": input.palette.text ?? "#1A1A1A",
    "[TEXT_LIGHT_COLOR]": input.palette.muted ?? "#E8E8E8",
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
