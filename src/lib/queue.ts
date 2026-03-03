import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface GenerationJob {
  jobId: string;
  projectId: string;
  templateId: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords?: string[];
  parentJobId?: string;
  editPrompt?: string;
}

export async function enqueueJob(job: GenerationJob) {
  const { env } = getCloudflareContext();
  const queue = (env as CloudflareEnv).GENERATION_QUEUE;
  if (!queue) {
    throw new Error("GENERATION_QUEUE binding not available");
  }
  await queue.send(job);
}
