import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, projects } from "@/server/db";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // logo-dark, logo-light, photo

  const db = getDb();
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .get();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const keyMap: Record<string, string | null> = {
    "logo-dark": project.logoDarkR2Key,
    "logo-light": project.logoLightR2Key,
    photo: project.photoR2Key,
  };

  const r2Key = keyMap[type ?? ""];
  if (!r2Key) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  try {
    const { env } = getCloudflareContext();
    const bucket = (env as CloudflareEnv).STORAGE;
    const obj = await bucket.get(r2Key);
    if (!obj) {
      return NextResponse.json({ error: "File not found in R2" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", obj.httpMetadata?.contentType ?? "image/png");
    headers.set("Cache-Control", "public, max-age=86400");
    return new Response(obj.body, { headers });
  } catch {
    return NextResponse.json({ error: "R2 error" }, { status: 500 });
  }
}
