import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, jobs, projects, templates } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { createBatchJobsSchema, createEditJobSchema } from "@/lib/schemas/job";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const db = getDb();

  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.projectId, id))
    .orderBy(desc(jobs.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      benefits: r.benefitsJson ? JSON.parse(r.benefitsJson) : [],
      keywords: r.keywordsJson ? JSON.parse(r.keywordsJson) : [],
      outputUrl: r.outputR2Key
        ? `/api/projects/${id}/jobs/${r.id}?image=1`
        : null,
    }))
  );
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = (await req.json()) as Record<string, unknown>;
  const db = getDb();

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Handle edit job
  if (body.parentJobId) {
    const editParsed = createEditJobSchema.safeParse(body);
    if (!editParsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: editParsed.error.flatten() },
        { status: 400 }
      );
    }

    const parentJob = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, editParsed.data.parentJobId))
      .get();

    if (!parentJob) {
      return NextResponse.json({ error: "Parent job not found" }, { status: 404 });
    }

    const jobId = `job_${crypto.randomUUID()}`;
    await db.insert(jobs).values({
      id: jobId,
      projectId: id,
      templateId: parentJob.templateId,
      headline: parentJob.headline,
      benefitsJson: parentJob.benefitsJson,
      ctaText: parentJob.ctaText,
      keywordsJson: parentJob.keywordsJson,
      parentJobId: editParsed.data.parentJobId,
      editPrompt: editParsed.data.editPrompt,
      status: "queued",
      createdBy: session.user.id,
    });

    // Fire-and-forget: trigger processing via self-reference
    triggerProcessing(id, jobId);

    return NextResponse.json({ jobIds: [jobId] }, { status: 201 });
  }

  // Handle batch creation
  const batchParsed = createBatchJobsSchema.safeParse(body);
  if (!batchParsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: batchParsed.error.flatten() },
      { status: 400 }
    );
  }

  const jobIds: string[] = [];

  for (const jobInput of batchParsed.data.jobs) {
    // Verify template exists
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.id, jobInput.templateId))
      .get();

    if (!template) {
      return NextResponse.json(
        { error: `Template ${jobInput.templateId} not found` },
        { status: 400 }
      );
    }

    const jobId = `job_${crypto.randomUUID()}`;
    await db.insert(jobs).values({
      id: jobId,
      projectId: id,
      templateId: jobInput.templateId,
      headline: jobInput.headline,
      benefitsJson: jobInput.benefits ? JSON.stringify(jobInput.benefits) : null,
      ctaText: jobInput.ctaText,
      keywordsJson: jobInput.keywords ? JSON.stringify(jobInput.keywords) : null,
      refImageR2Key: jobInput.refImageR2Key ?? null,
      status: "queued",
      createdBy: session.user.id,
    });

    // Fire-and-forget: trigger processing via self-reference
    triggerProcessing(id, jobId);

    jobIds.push(jobId);
  }

  return NextResponse.json({ jobIds }, { status: 201 });
}

function triggerProcessing(projectId: string, jobId: string) {
  try {
    const { ctx, env } = getCloudflareContext();
    const selfWorker = (env as CloudflareEnv).WORKER_SELF_REFERENCE;
    if (selfWorker && ctx?.waitUntil) {
      // Fire-and-forget via waitUntil — runs after response is sent
      ctx.waitUntil(
        selfWorker.fetch(
          new Request(
            `https://internal/api/projects/${projectId}/jobs/${jobId}/process`,
            { method: "POST" }
          )
        ).catch((e: unknown) => console.error("Process trigger failed:", e))
      );
    } else {
      // Fallback: direct fetch (won't block response thanks to no await)
      fetch(
        `https://creative-post.lucas-f58.workers.dev/api/projects/${projectId}/jobs/${jobId}/process`,
        { method: "POST" }
      ).catch((e: unknown) => console.error("Process trigger failed:", e));
    }
  } catch (e) {
    console.error("Could not trigger processing:", e);
  }
}
