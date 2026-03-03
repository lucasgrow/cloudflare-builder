import { generateCreative } from "./generate";
import type { GenerationJob, WorkerEnv } from "./types";

export default {
  async queue(
    batch: MessageBatch<GenerationJob>,
    env: WorkerEnv
  ): Promise<void> {
    for (const msg of batch.messages) {
      try {
        console.log(`Processing job ${msg.body.jobId}`);
        await generateCreative(msg.body, env);
        msg.ack();
        console.log(`Job ${msg.body.jobId} completed`);
      } catch (e) {
        console.error(`Job ${msg.body.jobId} failed:`, e);
        msg.retry();
      }
    }
  },
};
