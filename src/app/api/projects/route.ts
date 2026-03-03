import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, projects } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { createProjectSchema } from "@/lib/schemas/project";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.createdBy, session.user.id))
    .orderBy(desc(projects.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = `prj_${crypto.randomUUID()}`;

  await db.insert(projects).values({
    id,
    name: parsed.data.name,
    slug: parsed.data.slug,
    paletteJson: JSON.stringify(parsed.data.palette),
    typographyJson: JSON.stringify(parsed.data.typography),
    logoDescription: parsed.data.logoDescription,
    promptInjection: parsed.data.promptInjection,
    logoDarkR2Key: parsed.data.logoDarkR2Key,
    logoLightR2Key: parsed.data.logoLightR2Key,
    photoR2Key: parsed.data.photoR2Key,
    createdBy: session.user.id,
  });

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  return NextResponse.json(project, { status: 201 });
}
