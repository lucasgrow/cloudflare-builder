import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, projectRefs } from "@/server/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

const addRefSchema = z.object({
  r2Key: z.string().min(1),
  type: z.enum(["style_ref", "extra_photo"]),
  label: z.string().optional(),
});

const deleteRefSchema = z.object({
  refId: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addRefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = getDb();
  const refId = `prf_${crypto.randomUUID()}`;

  await db.insert(projectRefs).values({
    id: refId,
    projectId: params.id,
    r2Key: parsed.data.r2Key,
    type: parsed.data.type,
    label: parsed.data.label ?? null,
  });

  return NextResponse.json({ id: refId }, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = deleteRefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid refId" }, { status: 400 });
  }

  const db = getDb();

  // Get ref to delete R2 object
  const ref = await db
    .select()
    .from(projectRefs)
    .where(
      and(
        eq(projectRefs.id, parsed.data.refId),
        eq(projectRefs.projectId, params.id)
      )
    )
    .get();

  if (!ref) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from R2
  try {
    const { env } = getCloudflareContext();
    const bucket = (env as CloudflareEnv).STORAGE;
    await bucket.delete(ref.r2Key);
  } catch {
    // R2 delete failure is non-fatal
  }

  await db
    .delete(projectRefs)
    .where(eq(projectRefs.id, parsed.data.refId));

  return NextResponse.json({ ok: true });
}
