import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, projects, projectRefs, jobs } from "@/server/db";
import { eq, count } from "drizzle-orm";

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

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const refs = await db
    .select()
    .from(projectRefs)
    .where(eq(projectRefs.projectId, id));

  const [jobsCount] = await db
    .select({ count: count() })
    .from(jobs)
    .where(eq(jobs.projectId, id));

  return NextResponse.json({
    ...project,
    palette: JSON.parse(project.paletteJson),
    typography: JSON.parse(project.typographyJson),
    refs: refs.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      r2Key: r.r2Key,
    })),
    refsCount: refs.length,
    jobsCount: jobsCount?.count ?? 0,
  });
}

export async function PATCH(
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

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name;
  if (body.slug) updates.slug = body.slug;
  if (body.palette) updates.paletteJson = JSON.stringify(body.palette);
  if (body.typography) updates.typographyJson = JSON.stringify(body.typography);
  if (body.logoDescription !== undefined) updates.logoDescription = body.logoDescription;
  if (body.promptInjection) updates.promptInjection = body.promptInjection;
  if (body.logoDarkR2Key !== undefined) updates.logoDarkR2Key = body.logoDarkR2Key;
  if (body.logoLightR2Key !== undefined) updates.logoLightR2Key = body.logoLightR2Key;
  if (body.photoR2Key !== undefined) updates.photoR2Key = body.photoR2Key;

  if (Object.keys(updates).length > 0) {
    await db.update(projects).set(updates).where(eq(projects.id, id));
  }

  const updated = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  return NextResponse.json(updated);
}
