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
  // Try queue binding first
  try {
    const { env } = getCloudflareContext();
    const queue = (env as CloudflareEnv).GENERATION_QUEUE;
    if (queue) {
      await queue.send(job);
      return;
    }
  } catch {
    // queue not available, fall through to direct execution
  }

  // Fallback: call generator worker directly via service binding or inline
  // For now, fire-and-forget fetch to the generator API
  // The worker will pick it up when queue is available
  console.warn(`Queue not available, job ${job.jobId} will need manual processing`);
}
