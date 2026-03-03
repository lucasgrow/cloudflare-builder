import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, briefings, projects } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { createBriefingSchema } from "@/lib/schemas/briefing";
import { extractBriefing } from "@/lib/claude";

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
    .from(briefings)
    .where(eq(briefings.projectId, id))
    .orderBy(desc(briefings.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      ...r,
      extractedJson: r.extractedJson ? JSON.parse(r.extractedJson) : null,
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
  const body = await req.json();
  const parsed = createBriefingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const briefingId = `brf_${crypto.randomUUID()}`;

  await db.insert(briefings).values({
    id: briefingId,
    projectId: id,
    inputText: parsed.data.inputText,
    status: "pending",
    createdBy: session.user.id,
  });

  // Extract creatives via Claude
  const creatives = await extractBriefing({
    inputText: parsed.data.inputText,
    projectName: project.name,
  });

  await db
    .update(briefings)
    .set({
      extractedJson: JSON.stringify({ creatives }),
      status: "processed",
    })
    .where(eq(briefings.id, briefingId));

  return NextResponse.json(
    { id: briefingId, creatives, status: "processed" },
    { status: 201 }
  );
}
