import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb, projects, projectRefs } from "@/server/db";
import { eq, and } from "drizzle-orm";
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
  const type = url.searchParams.get("type"); // logo-dark, logo-light, photo, ref
  const refId = url.searchParams.get("refId"); // for ref type

  let r2Key: string | null = null;

  if (type === "ref" && refId) {
    // Serve a project ref image
    const db = getDb();
    const ref = await db
      .select()
      .from(projectRefs)
      .where(
        and(eq(projectRefs.id, refId), eq(projectRefs.projectId, id))
      )
      .get();
    r2Key = ref?.r2Key ?? null;
  } else {
    // Serve project asset
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
    r2Key = keyMap[type ?? ""] ?? null;
  }

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
