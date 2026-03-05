import { z } from "zod";

export const createJobSchema = z.object({
  templateId: z.string().min(1),
  headline: z.string().min(1),
  benefits: z.array(z.string()).max(5).optional(),
  ctaText: z.string().min(1),
  keywords: z.array(z.string()).max(5).optional(),
  refImageR2Key: z.string().optional(),
});

export const createBatchJobsSchema = z.object({
  jobs: z.array(createJobSchema).min(1).max(20),
});

export const createEditJobSchema = z.object({
  parentJobId: z.string().min(1),
  editPrompt: z.string().min(1),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateBatchJobsInput = z.infer<typeof createBatchJobsSchema>;
export type CreateEditJobInput = z.infer<typeof createEditJobSchema>;
