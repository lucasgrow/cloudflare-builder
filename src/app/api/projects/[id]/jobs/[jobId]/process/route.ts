import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildGenerationPrompt } from "@/lib/prompts";

export const dynamic = "force-dynamic";

interface ProjectRow {
  id: string;
  name: string;
  palette_json: string;
  typography_json: string;
  logo_description: string | null;
  prompt_injection: string;
  logo_dark_r2_key: string | null;
  logo_light_r2_key: string | null;
  photo_r2_key: string | null;
}

interface TemplateRow {
  id: string;
  slug: string;
  prompt_template: string;
}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string; jobId: string } }
) {
  // Auth skipped — this endpoint is called internally via service binding
  const { id: projectId, jobId } = params;
  const { env } = getCloudflareContext();
  const cfEnv = env as CloudflareEnv;
  const db = cfEnv.DATABASE;
  const storage = cfEnv.STORAGE;
  const geminiKey = cfEnv.GEMINI_API_KEY;

  if (!geminiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  // Load job
  const job = await db
    .prepare("SELECT * FROM jobs WHERE id = ? AND project_id = ?")
    .bind(jobId, projectId)
    .first<Record<string, string | null>>();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Mark as processing
  await db
    .prepare("UPDATE jobs SET status = 'processing' WHERE id = ?")
    .bind(jobId)
    .run();

  try {
    // Load project
    const project = await db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projectId)
      .first<ProjectRow>();

    if (!project) throw new Error("Project not found");

    // Load template
    const template = await db
      .prepare("SELECT * FROM templates WHERE id = ?")
      .bind(job.template_id)
      .first<TemplateRow>();

    if (!template) throw new Error("Template not found");

    const palette = JSON.parse(project.palette_json);

    // Build prompt
    let promptText: string;

    if (job.edit_prompt && job.parent_job_id) {
      promptText = `Edit this image with the following instruction: ${job.edit_prompt}\n\nKeep the same overall style, layout, and brand identity. Only change what is specifically requested.`;
    } else {
      const benefits = job.benefits_json ? JSON.parse(job.benefits_json) : undefined;
      const keywords = job.keywords_json ? JSON.parse(job.keywords_json) : undefined;
      promptText = buildGenerationPrompt({
        templatePrompt: template.prompt_template,
        headline: job.headline ?? "",
        benefits,
        ctaText: job.cta_text ?? "",
        keywords,
        palette,
        logoDescription: project.logo_description ?? undefined,
        promptInjection: project.prompt_injection,
      });
    }

    // Build parts
    const parts: GeminiPart[] = [{ text: promptText }];

    // Add images from R2
    if (job.edit_prompt && job.parent_job_id) {
      const parentJob = await db
        .prepare("SELECT output_r2_key FROM jobs WHERE id = ?")
        .bind(job.parent_job_id)
        .first<{ output_r2_key: string | null }>();

      if (parentJob?.output_r2_key) {
        const imgData = await fetchR2AsBase64(storage, parentJob.output_r2_key);
        if (imgData) parts.push({ inline_data: imgData });
      }
    } else {
      const isDarkStyle = ["checklist-split", "checklist-dark", "centralizado"].includes(template.slug);
      const logoKey = isDarkStyle
        ? (project.logo_dark_r2_key ?? project.logo_light_r2_key)
        : (project.logo_light_r2_key ?? project.logo_dark_r2_key);

      if (logoKey) {
        const logoData = await fetchR2AsBase64(storage, logoKey);
        if (logoData) parts.push({ inline_data: logoData });
      }

      const photoStyles = ["checklist-split", "checklist-clean", "half-half", "card-foto"];
      if (project.photo_r2_key && photoStyles.includes(template.slug)) {
        const photoData = await fetchR2AsBase64(storage, project.photo_r2_key);
        if (photoData) parts.push({ inline_data: photoData });
      }
    }

    // Call Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "3:4", imageSize: "2K" },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini ${geminiRes.status}: ${errText}`);
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
      }>;
    };

    const imagePart = geminiData?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart?.inlineData) {
      throw new Error("No image in Gemini response");
    }

    // Save to R2
    const ext = imagePart.inlineData.mimeType.includes("png") ? "png" : "jpg";
    const outputKey = `projects/${projectId}/outputs/${jobId}.${ext}`;

    const binary = atob(imagePart.inlineData.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    await storage.put(outputKey, bytes.buffer, {
      httpMetadata: { contentType: imagePart.inlineData.mimeType },
    });

    // Mark done
    await db
      .prepare("UPDATE jobs SET status = 'done', output_r2_key = ?, completed_at = ? WHERE id = ?")
      .bind(outputKey, new Date().toISOString(), jobId)
      .run();

    return NextResponse.json({ status: "done", outputKey });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await db
      .prepare("UPDATE jobs SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?")
      .bind(msg, new Date().toISOString(), jobId)
      .run();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function fetchR2AsBase64(
  bucket: R2Bucket,
  key: string
): Promise<{ mime_type: string; data: string } | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;

  const buffer = await obj.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const ext = key.split(".").pop()?.toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  return { mime_type: mime, data: base64 };
}
