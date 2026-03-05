import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, templates } from "@/server/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      slug: templates.slug,
      layoutDescription: templates.layoutDescription,
    })
    .from(templates)
    .where(eq(templates.isCustom, 0));

  return NextResponse.json(rows);
}
