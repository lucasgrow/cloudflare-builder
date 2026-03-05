/**
 * Seed 6 default templates from Phase A styles.
 * Run: bun run scripts/seed-templates.ts
 */

const TEMPLATES = [
  {
    name: "Checklist Split",
    slug: "checklist-split",
    layout_description:
      "Split layout: professional photo right (40-45%), headline + checklist left (55%), dark background. High authority feel.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

LAYOUT: Vertical split composition. Left 58% is a solid dark background ([DARK_BG_COLOR]). Right 42% is a high-quality professional photograph filling the full height edge-to-edge, no border, no padding. The photo subject faces left, toward the text content.

PHOTO (right side): [PHOTO_DESCRIPTION]. The person faces left. Sharp, clinical-quality lighting. No background visible — the photo fills the entire right column from top to bottom.

LEFT COLUMN — top to bottom, left-aligned, generous left and top padding:

1. LOGO: top-left corner, small (roughly 15% of the column width), white or brand-appropriate rendering. [LOGO_INSTRUCTION]

2. HEADLINE: "[HEADLINE]". Large serif typeface, white (#FFFFFF), bold weight. Font size approximately 52–60pt. Left-aligned. 2–3 line break where natural. This is the largest typographic element on the canvas. Generous top margin below logo.

3. CHECKLIST: Three benefit pills stacked vertically with equal spacing (~16px gap). Each pill is a rounded rectangle (border-radius ~12px) with a semi-transparent accent overlay ([ACCENT_COLOR] at 15–20% opacity) and a 1px accent border ([ACCENT_COLOR]). Inside each pill: a checkmark icon (✓) in [ACCENT_COLOR] on the left, followed by white text in medium-weight sans-serif. Pill items:
   — "[BENEFIT_1]"
   — "[BENEFIT_2]"
   — "[BENEFIT_3]"

4. CTA PILL: solid [ACCENT_COLOR] rounded pill, bottom-left area, white bold sans-serif text "[CTA_TEXT] →". Pill height ~44px, left-padded text, arrow glyph at end.

VERTICAL DIVIDER: optional 1px subtle line or soft gradient at the split point between left column and photo.

OVERALL: Premium, clean, medical authority aesthetic. Dark background enforces focus on text. No decorative patterns or textures on background. Typography hierarchy is strict: headline > checklist text > CTA text.

[BRAND_PROMPT_INJECTION]`,
  },
  {
    name: "Centralizado",
    slug: "centralizado",
    layout_description:
      "Centered layout: dark background, large centered headline, central imagery, doctor name as authority marker, CTA bottom.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

BACKGROUND: Solid dark color [DARK_BG_COLOR] filling the entire canvas. No textures, no gradients, no decorative elements.

LAYOUT: Strict vertical center axis. All elements centered horizontally. Top to bottom reading order.

TOP SECTION:
1. LOGO: horizontally centered, top area (~10% from top), small size (roughly 120px wide). White or brand-tinted rendering. [LOGO_INSTRUCTION]

2. HEADLINE: "[HEADLINE]". Centered large serif typeface, white (#FFFFFF), bold. Font size approximately 58–68pt. Maximum 3 lines. This is the dominant visual element — largest text on the canvas. The word "[KEYWORD_1]" or "[KEYWORD_2]" may be rendered in [ACCENT_COLOR] for emphasis. Generous spacing below logo.

3. AUTHORITY LINE: "[DOCTOR_NAME] · [SPECIALTY]". Centered, medium-weight sans-serif, [TEXT_LIGHT_COLOR] at 70% opacity. Font size ~18pt. Sits immediately below headline with tighter spacing — acts as a credibility subtitle.

CENTER SECTION:
4. IMAGERY: [PHOTO_DESCRIPTION]. Centered on canvas, roughly 420–480px wide. Clean crop or soft circular/oval mask. If showing a face or body, slight vignette at edges to blend into dark background. Natural lighting, premium feel.

BOTTOM SECTION:
5. CTA PILL: solid [ACCENT_COLOR] rounded pill, horizontally centered, ~44px height. Bold white sans-serif text: "[CTA_TEXT] →". Positioned ~8% from bottom edge. Pill width fits text with generous horizontal padding (~32px each side).

SPACING: Equal breathing room above and below the imagery. The overall composition should feel balanced and symmetrical on the vertical axis.

OVERALL: Premium, focused, authoritative. No clutter. The headline commands attention first, the imagery creates emotional context, the CTA drives action.

[BRAND_PROMPT_INJECTION]`,
  },
  {
    name: "Checklist Clean",
    slug: "checklist-clean",
    layout_description:
      "Light background: cream/off-white bg, professional photo top-right with rounded corner, clean checklist without pill backgrounds, gold CTA.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

BACKGROUND: Light cream or off-white ([LIGHT_BG_COLOR]) solid fill covering the entire canvas. No textures. Slightly warm tone.

LAYOUT: Left-heavy composition. Photo anchored top-right. Text content dominates left and center.

TOP ROW (horizontal across top ~25% of canvas):

1. TOP-LEFT: Logo followed by doctor identification.
   - LOGO: small, brand-rendered, dark tones (not white). [LOGO_INSTRUCTION]
   - Below or beside logo: "[DOCTOR_NAME]" in spaced-out serif uppercase, small (~14pt), [TEXT_DARK_COLOR]. Then "· [SPECIALTY]" in lighter weight same size. Premium editorial feel.

2. TOP-RIGHT: Professional photograph of [PHOTO_DESCRIPTION]. Image dimensions ~380px wide × 420px tall. Positioned flush to top edge and right edge. Bottom-left corner rounded (border-radius ~40px), all other corners square. No border. Natural skin tones, clean background or deemphasized background. The subject faces forward or slightly left.

MAIN CONTENT (left 60% of canvas, below top row):

3. HEADLINE: "[HEADLINE]". Left-aligned bold serif typeface, [TEXT_DARK_COLOR], font size approximately 52–60pt. 2–3 lines. This is the largest text element. The word "[KEYWORD_1]" may be in [ACCENT_COLOR] or italic for emphasis. Generous top margin from the logo/name row.

4. CHECKLIST: Three items stacked vertically (~20px gap between items). No pill, no background box — clean open layout. Each item:
   - A checkmark icon (✓ or solid circle-check) in [ACCENT_COLOR], ~18px
   - Followed by text in medium-weight sans-serif, [TEXT_DARK_COLOR], ~16–18pt
   Items:
   — "[BENEFIT_1]"
   — "[BENEFIT_2]"
   — "[BENEFIT_3]"

5. CTA PILL: solid [ACCENT_COLOR] rounded pill (border-radius ~22px), bottom-left area. Bold text "[CTA_TEXT] →" in white or [TEXT_DARK_COLOR] depending on accent luminance. ~44px height, generous horizontal padding. Positioned with breathing room above canvas bottom.

SPACING: Open negative space is intentional. Do not fill the canvas. The cream background should breathe.

OVERALL: Editorial, elegant, premium. Light feel contrasting with the authority of the dark serif headline. No heavy borders or decorative lines.

[BRAND_PROMPT_INJECTION]`,
  },
  {
    name: "Checklist Dark",
    slug: "checklist-dark",
    layout_description:
      "Neutral warm background: khaki/beige bg, dark pill checklist on left, contextual photo on right split, warning/urgency headline below checklist.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

BACKGROUND: Warm neutral solid color — khaki, warm beige, or taupe tone ([LIGHT_BG_COLOR] — should be a muted warm neutral, NOT white). Full canvas fill. No textures.

LAYOUT: Asymmetric. Left 55% holds text content. Right 45% holds contextual photo. Vertical structure on left: header → checklist → warning headline → CTA.

HEADER ROW (top, full width):
1. LOGO: top-left, small (~110px wide), dark rendering to contrast against warm neutral bg. [LOGO_INSTRUCTION]
2. DOCTOR ID: beside logo, "[DOCTOR_NAME] · [SPECIALTY]" in small spaced serif uppercase, [TEXT_DARK_COLOR], ~13pt. Same top-left cluster.

LEFT COLUMN (55% width, vertical stack below header):

3. DARK PILL CHECKLIST: Three stacked pill items. Each pill is a solid dark rounded rectangle ([DARK_BG_COLOR], border-radius ~10px), full pill width (~380px), height ~52px. Inside each pill: a small filled bullet or checkmark icon in [ACCENT_COLOR] on left, white text in bold sans-serif ~16pt. Equal vertical gap (~12px) between pills:
   — "[BENEFIT_1]"
   — "[BENEFIT_2]"
   — "[BENEFIT_3]"

4. WARNING / SECONDARY HEADLINE: "[HEADLINE]". Below the checklist. Left-aligned, large bold sans-serif or serif, [TEXT_DARK_COLOR], ~38–44pt. May include a warning icon (⚠) before the text in [ACCENT_COLOR]. 2 lines maximum. This acts as a consequence or call-to-action headline — e.g. "Não ignore esses sinais."

5. CTA PILL: solid [ACCENT_COLOR] pill, rounded, bottom-left. White or dark text "[CTA_TEXT] →", bold sans-serif ~16pt. ~44px height. Generous padding.

RIGHT COLUMN (45% width, edge-to-right):
6. CONTEXTUAL PHOTO: [PHOTO_DESCRIPTION]. Right-aligned, fills right column from below header to above CTA row. No border. Clean crop. If the image has a background, allow it to blend with the warm neutral canvas softly. The photo complements but does not dominate.

OVERALL: Warm, grounded, medically authoritative. Dark pills create strong contrast against the warm bg — the checklist is immediately scannable. The warning headline drives urgency. The overall mood is cautionary-but-caring.

[BRAND_PROMPT_INJECTION]`,
  },
  {
    name: "Half Half",
    slug: "half-half",
    layout_description:
      "Horizontal split: solid color block top half with rounded bottom corners, logo + headline + supporting text; emotional/contextual photo fills bottom half.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

OVERALL STRUCTURE: Horizontal two-section split. Top ~48% is a solid color block. Bottom ~52% is a full-bleed photograph. The color block has rounded bottom-left and bottom-right corners (~40px radius) that overlap slightly onto the photo, creating a layered feel. The photo has no rounded corners — it bleeds to all 4 canvas edges at bottom.

TOP SECTION — solid color block ([ACCENT_COLOR] or [DARK_BG_COLOR]):

1. LOGO: positioned top-center or top-left, ~10% from top of block, white rendering. [LOGO_INSTRUCTION]

2. HEADLINE: "[HEADLINE]". Positioned left side of color block, vertically centered within the block. Large serif typeface, white (#FFFFFF), bold, ~58–66pt. Maximum 3 lines. Left-aligned with ~8% left padding. Generous line-height. This is the dominant typographic element. The word "[KEYWORD_1]" may be in a lighter weight or italic for contrast within white.

3. SUPPORTING TEXT: Right side of color block, vertically aligned with headline midpoint. Text: "[BENEFIT_1]". Smaller sans-serif, white at 85% opacity, ~17pt, max 2 lines, right-aligned or left-aligned starting at 60% width mark. Creates a right-column counterbalance to the large headline on the left.

4. DECORATIVE ELEMENT (optional): a thin horizontal rule or small geometric accent in white at 30% opacity, separating logo from headline area. Subtle — does not compete with text.

BOTTOM SECTION — full-bleed photograph:

5. PHOTO: [PHOTO_DESCRIPTION]. Fills entire bottom 52% of canvas edge-to-edge, left-to-right. Sharp, emotional, high-quality. Natural lighting. The image bleeds under the rounded corners of the color block above (the block sits on top). The photo should have emotional resonance — people, relationships, human context.

6. OPTIONAL BOTTOM TEXT: If needed, a small white text "[CTA_TEXT]" or "[DOCTOR_NAME] · [SPECIALTY]" centered at the very bottom of the photo area (~3% from bottom edge), white, small sans-serif ~13pt, with a subtle dark scrim (semi-transparent gradient) behind it for legibility.

DEPTH EFFECT: The color block should appear to float above the photo, achieved via the rounded bottom corners overlapping the image. The transition between sections feels intentional and designed — not a hard cut.

OVERALL: Emotionally resonant, visually unexpected, premium feel. The bold color block commands attention; the photo provides human connection. Works best for sensitive health topics, relationship health, or emotional conditions.

[BRAND_PROMPT_INJECTION]`,
  },
  {
    name: "Card Foto",
    slug: "card-foto",
    layout_description:
      "Gradient background: soft muted gradient, photo in prominent rounded card centered on canvas, vertical typographic hierarchy above and below card.",
    prompt_template: `Create a professional medical marketing social media post (1080x1080px square format).

BACKGROUND: Soft vertical gradient covering the entire canvas. Top: muted [ACCENT_COLOR] desaturated by ~60% (e.g. a soft dusty tone derived from the accent). Bottom: warm cream or off-white ([LIGHT_BG_COLOR]). The gradient is smooth and subtle — not dramatic. Think: editorial magazine background.

LAYOUT: Single vertical axis. All elements centered horizontally. Top to bottom reading order with the photo card as the visual focal point.

TOP AREA (~30% of canvas):

1. LOGO: horizontally centered, ~8% from top. Small (~110px wide). Render in [TEXT_DARK_COLOR] or [ACCENT_COLOR] to contrast the muted gradient. [LOGO_INSTRUCTION]

2. HEADLINE: "[HEADLINE]". Centered, large serif typeface, [TEXT_DARK_COLOR], ~52–60pt, bold. 1–2 lines. The word "[KEYWORD_1]" rendered in [ACCENT_COLOR] or bold italic for emphasis within the headline. The word "[KEYWORD_2]" may also be rendered in a slightly larger size or heavier weight. Generous margin below logo.

CENTER AREA (~40% of canvas):

3. PHOTO CARD: A prominent rounded rectangle card (border-radius ~24px) centered on canvas. Card dimensions ~680px wide × 380px tall. Card background: white or very light neutral (#FFFFFF or [LIGHT_BG_COLOR]). Inside the card: [PHOTO_DESCRIPTION], cropped to fill the card. The photo crops to the card's rounded corners cleanly. Drop shadow beneath card: soft, large radius (~30px), dark at ~20% opacity, offset 0 12px — gives a floating appearance. The card visually "sits" on the gradient background.

BOTTOM AREA (~30% of canvas):

4. SUBHEADLINE: "[BENEFIT_1]". Centered below card, medium sans-serif, [TEXT_DARK_COLOR] at 80% opacity, ~18pt. 1–2 lines. Serves as a reinforcing message or value proposition below the photo.

5. CTA PILL: solid [DARK_BG_COLOR] rounded pill, centered, ~44px height. White bold sans-serif text "[CTA_TEXT] →". Generous horizontal padding. Positioned ~6% above bottom of canvas.

6. DOCTOR ATTRIBUTION: "[DOCTOR_NAME] · [SPECIALTY]". Centered, bottom area, very small sans-serif ~12pt, [TEXT_DARK_COLOR] at 60% opacity. Spaced out letterforms. Sits below CTA pill, close to canvas bottom.

SPACING: The card is the visual anchor — generous whitespace above (between headline and card) and below (between card and subheadline). The gradient should have room to breathe and show.

SHADOW/DEPTH: Only the card has a shadow. All other elements are flat. This contrast in depth focuses attention on the photo.

OVERALL: Clean, aspirational, modern. The gradient background creates warmth without busyness. The floating card frames the photo with authority. Typography hierarchy is crisp: headline > subheadline > attribution.

[BRAND_PROMPT_INJECTION]`,
  },
];

async function main() {
  // Use better-sqlite3 directly for seeding
  const path = await import("node:path");
  const fs = await import("node:fs");

  const d1Dir = path.resolve(
    ".wrangler",
    "state",
    "v3",
    "d1",
    "miniflare-D1DatabaseObject"
  );
  const files = fs.readdirSync(d1Dir);
  const sqliteFile = files.find((f: string) => f.endsWith(".sqlite"));
  if (!sqliteFile) throw new Error("No local D1 database found");

  const dbPath = path.join(d1Dir, sqliteFile);
  const { Database } = await import("bun:sqlite");
  const db = new Database(dbPath);

  const insert = db.prepare(
    `INSERT OR REPLACE INTO templates (id, name, slug, prompt_template, layout_description, is_custom, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  );

  const now = new Date().toISOString();

  for (const t of TEMPLATES) {
    const id = `tpl_${crypto.randomUUID()}`;
    insert.run(id, t.name, t.slug, t.prompt_template, t.layout_description, now);
    console.log(`✓ Seeded template: ${t.slug}`);
  }

  db.close();
  console.log(`\nDone — ${TEMPLATES.length} templates seeded.`);
}

main().catch(console.error);
