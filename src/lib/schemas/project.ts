import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const paletteSchema = z.object({
  accent: hexColor,
  dark: hexColor,
  light: hexColor,
  text: hexColor,
  muted: hexColor,
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
  logoDarkR2Key: z.string().optional(),
  logoLightR2Key: z.string().optional(),
  photoR2Key: z.string().optional(),
});

export type Palette = z.infer<typeof paletteSchema>;
export type Typography = z.infer<typeof typographySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
