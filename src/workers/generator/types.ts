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

export interface WorkerEnv {
  DATABASE: D1Database;
  STORAGE: R2Bucket;
  GEMINI_API_KEY: string;
}
