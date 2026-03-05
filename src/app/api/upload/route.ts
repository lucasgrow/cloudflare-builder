import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { generatePresignedUploadUrl } from "@/lib/r2";
import { z } from "zod";

export const dynamic = "force-dynamic";

const uploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  prefix: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await generatePresignedUploadUrl({
    filename: parsed.data.filename,
    contentType: parsed.data.contentType,
    prefix: parsed.data.prefix,
  });

  return NextResponse.json(result);
}
