import { z } from "zod";

export const createBriefingSchema = z.object({
  inputText: z.string().min(10).max(10000),
});

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

export type CreateBriefingInput = z.infer<typeof createBriefingSchema>;
export type ExtractedCreative = z.infer<typeof extractedCreativeSchema>;
export type ExtractedBriefing = z.infer<typeof extractedBriefingSchema>;
