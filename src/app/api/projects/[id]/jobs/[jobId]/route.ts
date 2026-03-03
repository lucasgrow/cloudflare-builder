import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, jobs } from "@/server/db";
import { eq } from "drizzle-orm";
import { generatePresignedReadUrl } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const db = getDb();

  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .get();

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let outputUrl: string | null = null;
  if (job.outputR2Key) {
    try {
      outputUrl = await generatePresignedReadUrl({ key: job.outputR2Key });
    } catch {
      // R2 not configured, return key only
    }
  }

  return NextResponse.json({
    ...job,
    benefits: job.benefitsJson ? JSON.parse(job.benefitsJson) : [],
    keywords: job.keywordsJson ? JSON.parse(job.keywordsJson) : [],
    outputUrl,
  });
}
