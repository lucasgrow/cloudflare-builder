import { buildGenerationPrompt } from "../../lib/prompts";
import type { GenerationJob, WorkerEnv } from "./types";

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
  inlineData?: { mimeType: string; data: string };
}

// --- Main pipeline ---

export async function generateCreative(
  job: GenerationJob,
  env: WorkerEnv
): Promise<void> {
  const db = env.DATABASE;

  // 1. Mark as processing
  await db
    .prepare("UPDATE jobs SET status = 'processing' WHERE id = ?")
    .bind(job.jobId)
    .run();

  try {
    // 2. Load project
    const project = await db
      .prepare("SELECT * FROM projects WHERE id = ?")
      .bind(job.projectId)
      .first<ProjectRow>();

    if (!project) throw new Error(`Project ${job.projectId} not found`);

    // 3. Load template
    const template = await db
      .prepare("SELECT * FROM templates WHERE id = ?")
      .bind(job.templateId)
      .first<TemplateRow>();

    if (!template) throw new Error(`Template ${job.templateId} not found`);

    const palette = JSON.parse(project.palette_json);

    // 4. Build prompt
    let promptText: string;

    if (job.editPrompt && job.parentJobId) {
      // Edit mode: load parent output and send edit instruction
      const parentJob = await db
        .prepare("SELECT output_r2_key FROM jobs WHERE id = ?")
        .bind(job.parentJobId)
        .first<{ output_r2_key: string | null }>();

      if (!parentJob?.output_r2_key) {
        throw new Error("Parent job has no output image");
      }

      promptText = `Edit this image with the following instruction: ${job.editPrompt}

Keep the same overall style, layout, and brand identity. Only change what is specifically requested.`;
    } else {
      // New generation
      promptText = buildGenerationPrompt({
        templatePrompt: template.prompt_template,
        headline: job.headline,
        benefits: job.benefits,
        ctaText: job.ctaText,
        keywords: job.keywords,
        palette,
        logoDescription: project.logo_description ?? undefined,
        promptInjection: project.prompt_injection,
      });
    }

    // 5. Build Gemini request parts
    const parts: GeminiPart[] = [{ text: promptText }];

    // Add images from R2
    if (job.editPrompt && job.parentJobId) {
      // For edits, include the parent output image
      const parentJob = await db
        .prepare("SELECT output_r2_key FROM jobs WHERE id = ?")
        .bind(job.parentJobId)
        .first<{ output_r2_key: string | null }>();

      if (parentJob?.output_r2_key) {
        const imgData = await fetchR2AsBase64(env.STORAGE, parentJob.output_r2_key);
        if (imgData) parts.push({ inline_data: imgData });
      }
    } else {
      // For new generation, include assets
      const isDarkStyle = ["checklist-split", "checklist-dark", "centralizado"].includes(template.slug);
      const logoKey = isDarkStyle ? project.logo_dark_r2_key : project.logo_light_r2_key;

      if (logoKey) {
        const logoData = await fetchR2AsBase64(env.STORAGE, logoKey);
        if (logoData) parts.push({ inline_data: logoData });
      }

      const photoStyles = ["checklist-split", "checklist-clean", "half-half", "card-foto"];
      if (project.photo_r2_key && photoStyles.includes(template.slug)) {
        const photoData = await fetchR2AsBase64(env.STORAGE, project.photo_r2_key);
        if (photoData) parts.push({ inline_data: photoData });
      }

      // Add style reference images from project_refs
      const refs = await db
        .prepare(
          "SELECT r2_key FROM project_refs WHERE project_id = ? AND type = 'style_ref' LIMIT 3"
        )
        .bind(job.projectId)
        .all<{ r2_key: string }>();

      if (refs.results) {
        for (const ref of refs.results) {
          const refData = await fetchR2AsBase64(env.STORAGE, ref.r2_key);
          if (refData) parts.push({ inline_data: refData });
        }
      }
    }

    // 6. Call Gemini
    const geminiResponse = await callGemini(env.GEMINI_API_KEY, parts);

    // 7. Extract image from response
    const imageData = extractImage(geminiResponse);
    if (!imageData) {
      throw new Error("No image in Gemini response");
    }

    // 8. Save to R2
    const ext = imageData.mimeType.includes("png") ? "png" : "jpg";
    const outputKey = `projects/${job.projectId}/outputs/${job.jobId}.${ext}`;

    const imageBytes = base64ToArrayBuffer(imageData.data);
    await env.STORAGE.put(outputKey, imageBytes, {
      httpMetadata: { contentType: imageData.mimeType },
    });

    // 9. Update job as done
    await db
      .prepare(
        "UPDATE jobs SET status = 'done', output_r2_key = ?, completed_at = ? WHERE id = ?"
      )
      .bind(outputKey, new Date().toISOString(), job.jobId)
      .run();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    await db
      .prepare(
        "UPDATE jobs SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?"
      )
      .bind(errorMessage, new Date().toISOString(), job.jobId)
      .run();
    throw e;
  }
}

// --- Helpers ---

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
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

  return { mime_type: mime, data: base64 };
}

async function callGemini(
  apiKey: string,
  parts: GeminiPart[]
): Promise<unknown> {
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "2K",
      },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  return res.json();
}

function extractImage(
  response: unknown
): { mimeType: string; data: string } | null {
  const resp = response as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType: string; data: string } }> };
    }>;
  };

  const parts = resp?.candidates?.[0]?.content?.parts;
  if (!parts) return null;

  for (const part of parts) {
    if (part.inlineData) {
      return {
        mimeType: part.inlineData.mimeType,
        data: part.inlineData.data,
      };
    }
  }

  return null;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
