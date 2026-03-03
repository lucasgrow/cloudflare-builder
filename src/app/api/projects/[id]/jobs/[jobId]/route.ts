import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, jobs } from "@/server/db";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string; jobId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = params;
  const url = new URL(req.url);
  const wantImage = url.searchParams.get("image") === "1";

  const db = getDb();
  const job = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .get();

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Serve image directly from R2 binding
  if (wantImage && job.outputR2Key) {
    try {
      const { env } = getCloudflareContext();
      const bucket = (env as CloudflareEnv).STORAGE;
      const obj = await bucket.get(job.outputR2Key);
      if (obj) {
        const headers = new Headers();
        headers.set("Content-Type", obj.httpMetadata?.contentType ?? "image/jpeg");
        headers.set("Cache-Control", "public, max-age=86400");
        return new Response(obj.body, { headers });
      }
    } catch {
      // fall through
    }
  }

  return NextResponse.json({
    ...job,
    benefits: job.benefitsJson ? JSON.parse(job.benefitsJson) : [],
    keywords: job.keywordsJson ? JSON.parse(job.keywordsJson) : [],
    outputUrl: job.outputR2Key
      ? `/api/projects/${params.id}/jobs/${jobId}?image=1`
      : null,
  });
}
