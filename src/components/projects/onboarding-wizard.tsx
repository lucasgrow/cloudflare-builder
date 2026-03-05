"use client";

import { useState, useCallback } from "react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Select,
  SelectItem,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

// --- Types ---

interface Palette {
  accent: string;
  dark: string;
  light: string;
  text: string;
  muted: string;
}

interface Typography {
  headline: string;
  body: string;
}

interface WizardData {
  name: string;
  slug: string;
  palette: Palette;
  typography: Typography;
  logoDescription: string;
  promptInjection: string;
  logoDarkR2Key: string;
  logoLightR2Key: string;
  photoR2Key: string;
  refKeys: string[];
}

const STEPS = [
  "Basics",
  "Assets",
  "Visual Identity",
  "Prompt Injection",
  "Style Refs",
  "Review",
];

const FONT_OPTIONS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Merriweather",
  "Lora",
  "Source Serif Pro",
  "Montserrat",
  "Open Sans",
  "Roboto",
  "Inter",
  "Helvetica",
];

const DEFAULT_PALETTE: Palette = {
  accent: "#B8964E",
  dark: "#2C2C2C",
  light: "#F5F0EB",
  text: "#1A1A1A",
  muted: "#8A8A8A",
};

const DEFAULT_TYPOGRAPHY: Typography = {
  headline: "Playfair Display",
  body: "Montserrat",
};

// --- Upload helper ---

async function uploadFile(
  file: File,
  prefix: string
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      prefix,
    }),
  });
  const { uploadUrl, key } = (await res.json()) as { uploadUrl: string; key: string };
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return key;
}

// --- Component ---

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [data, setData] = useState<WizardData>({
    name: "",
    slug: "",
    palette: DEFAULT_PALETTE,
    typography: DEFAULT_TYPOGRAPHY,
    logoDescription: "",
    promptInjection: "",
    logoDarkR2Key: "",
    logoLightR2Key: "",
    photoR2Key: "",
    refKeys: [],
  });

  // Upload state
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const update = useCallback(
    (field: keyof WizardData, value: unknown) => {
      setData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const updatePalette = useCallback(
    (key: keyof Palette, value: string) => {
      setData((prev) => ({
        ...prev,
        palette: { ...prev.palette, [key]: value },
      }));
    },
    []
  );

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (value: string) => {
      update("name", value);
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      update("slug", slug);
    },
    [update]
  );

  // Auto-generate prompt injection
  const generatePromptInjection = useCallback(() => {
    const p = data.palette;
    const t = data.typography;
    return `BRAND IDENTITY: "${data.name}"
ACCENT COLOR: ${p.accent} — use for CTA buttons, accent bars, keyword highlights.
DARK BACKGROUNDS: Use ${p.dark}, NOT pure black #000000.
LIGHT BACKGROUNDS: Use ${p.light}, NOT pure white #FFFFFF.
HEADLINE TYPOGRAPHY: ${t.headline}, bold. Tight line-height (1.1).
BODY TYPOGRAPHY: ${t.body}, clean sans-serif.
CTA BUTTON: Pill shape with rounded corners, ${p.accent} background, white bold text, arrow → icon.
${data.logoDescription ? `LOGO: ${data.logoDescription}` : ""}
OVERALL MOOD: Premium, sophisticated, trustworthy. High-end medical branding.`;
  }, [data.name, data.palette, data.typography, data.logoDescription]);

  // File upload handler
  const handleUpload = useCallback(
    async (
      file: File,
      field: "logoDarkR2Key" | "logoLightR2Key" | "photoR2Key",
      prefix: string
    ) => {
      setUploading((prev) => ({ ...prev, [field]: true }));
      try {
        const key = await uploadFile(file, prefix);
        update(field, key);
      } catch (e) {
        setErrors((prev) => ({
          ...prev,
          [field]: "Upload failed",
        }));
      } finally {
        setUploading((prev) => ({ ...prev, [field]: false }));
      }
    },
    [update]
  );

  const handleRefUpload = useCallback(
    async (file: File) => {
      setUploading((prev) => ({ ...prev, refs: true }));
      try {
        const key = await uploadFile(file, `projects/temp/refs`);
        setData((prev) => ({
          ...prev,
          refKeys: [...prev.refKeys, key],
        }));
      } catch {
        setErrors((prev) => ({ ...prev, refs: "Upload failed" }));
      } finally {
        setUploading((prev) => ({ ...prev, refs: false }));
      }
    },
    []
  );

  // Validation per step
  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!data.name.trim()) newErrors.name = "Name is required";
      if (!data.slug.trim()) newErrors.slug = "Slug is required";
      if (!/^[a-z0-9-]+$/.test(data.slug))
        newErrors.slug = "Only lowercase letters, numbers, and dashes";
    }

    if (step === 2) {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const [key, val] of Object.entries(data.palette)) {
        if (!hexRegex.test(val)) newErrors[`palette.${key}`] = "Invalid hex";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, data]);

  const next = useCallback(() => {
    if (validateStep()) {
      if (step === 2) {
        // Auto-generate prompt injection when leaving visual identity step
        update("promptInjection", generatePromptInjection());
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  }, [step, validateStep, update, generatePromptInjection]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          palette: data.palette,
          typography: data.typography,
          logoDescription: data.logoDescription || undefined,
          promptInjection: data.promptInjection,
          logoDarkR2Key: data.logoDarkR2Key || undefined,
          logoLightR2Key: data.logoLightR2Key || undefined,
          photoR2Key: data.photoR2Key || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setErrors({ submit: err.error || "Failed to create project" });
        return;
      }

      const project = (await res.json()) as { id: string };
      router.push(`/projects/${project.id}`);
    } catch {
      setErrors({ submit: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }, [data, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-small">
          <span className="font-medium">{STEPS[step]}</span>
          <span className="text-default-400">
            {step + 1} / {STEPS.length}
          </span>
        </div>
        <Progress
          value={((step + 1) / STEPS.length) * 100}
          color="primary"
          size="sm"
        />
      </div>

      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-lg font-semibold">{STEPS[step]}</h2>
        </CardHeader>
        <CardBody className="gap-4">
          {/* Step 0: Basics */}
          {step === 0 && (
            <>
              <Input
                label="Project Name"
                placeholder="Dr. Samuel Cagnolati"
                value={data.name}
                onValueChange={handleNameChange}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
              <Input
                label="Slug"
                placeholder="dr-samuel-cagnolati"
                value={data.slug}
                onValueChange={(v) => update("slug", v)}
                isInvalid={!!errors.slug}
                errorMessage={errors.slug}
                description="Used in URLs. Lowercase, numbers, dashes only."
              />
            </>
          )}

          {/* Step 1: Assets */}
          {step === 1 && (
            <>
              <FileUploadField
                label="Logo (Dark Background)"
                description="White/light logo for dark backgrounds"
                accept="image/*"
                uploaded={!!data.logoDarkR2Key}
                uploading={!!uploading.logoDarkR2Key}
                error={errors.logoDarkR2Key}
                onFile={(f) =>
                  handleUpload(f, "logoDarkR2Key", `projects/temp/assets`)
                }
              />
              <FileUploadField
                label="Logo (Light Background)"
                description="Dark/colored logo for light backgrounds"
                accept="image/*"
                uploaded={!!data.logoLightR2Key}
                uploading={!!uploading.logoLightR2Key}
                error={errors.logoLightR2Key}
                onFile={(f) =>
                  handleUpload(f, "logoLightR2Key", `projects/temp/assets`)
                }
              />
              <FileUploadField
                label="Professional Photo"
                description="High-quality portrait photo of the professional"
                accept="image/*"
                uploaded={!!data.photoR2Key}
                uploading={!!uploading.photoR2Key}
                error={errors.photoR2Key}
                onFile={(f) =>
                  handleUpload(f, "photoR2Key", `projects/temp/assets`)
                }
              />
              <Textarea
                label="Logo Description"
                placeholder='Elegant interlocking "SC" monogram...'
                value={data.logoDescription}
                onValueChange={(v) => update("logoDescription", v)}
                description="Describe the logo for Gemini to reproduce it."
              />
            </>
          )}

          {/* Step 2: Visual Identity */}
          {step === 2 && (
            <>
              <p className="text-small text-default-500">
                Define the brand color palette.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(
                  Object.entries(data.palette) as [keyof Palette, string][]
                ).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => updatePalette(key, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-divider cursor-pointer"
                    />
                    <Input
                      size="sm"
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={val}
                      onValueChange={(v) => updatePalette(key, v)}
                      isInvalid={!!errors[`palette.${key}`]}
                      errorMessage={errors[`palette.${key}`]}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>

              <Divider />

              <p className="text-small text-default-500">Typography</p>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Headline Font"
                  selectedKeys={[data.typography.headline]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    if (val)
                      setData((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, headline: val },
                      }));
                  }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f}>{f}</SelectItem>
                  ))}
                </Select>
                <Select
                  label="Body Font"
                  selectedKeys={[data.typography.body]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    if (val)
                      setData((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, body: val },
                      }));
                  }}
                >
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f}>{f}</SelectItem>
                  ))}
                </Select>
              </div>
            </>
          )}

          {/* Step 3: Prompt Injection */}
          {step === 3 && (
            <>
              <p className="text-small text-default-500">
                This text is appended to every Gemini prompt. Auto-generated
                from your palette and typography — edit freely.
              </p>
              <Textarea
                label="Prompt Injection"
                value={data.promptInjection}
                onValueChange={(v) => update("promptInjection", v)}
                minRows={10}
                maxRows={20}
              />
              <Button
                variant="flat"
                size="sm"
                onPress={() =>
                  update("promptInjection", generatePromptInjection())
                }
                startContent={
                  <Icon icon="solar:refresh-linear" width={16} />
                }
              >
                Regenerate from fields
              </Button>
            </>
          )}

          {/* Step 4: Style Refs */}
          {step === 4 && (
            <>
              <p className="text-small text-default-500">
                Upload 2-3 reference images that represent the visual style you
                want. These drive style transfer in Gemini.
              </p>
              <FileUploadField
                label="Add Reference Image"
                accept="image/*"
                uploaded={false}
                uploading={!!uploading.refs}
                error={errors.refs}
                onFile={handleRefUpload}
              />
              {data.refKeys.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.refKeys.map((key, i) => (
                    <Chip
                      key={key}
                      onClose={() =>
                        setData((prev) => ({
                          ...prev,
                          refKeys: prev.refKeys.filter((_, j) => j !== i),
                        }))
                      }
                      variant="flat"
                    >
                      Ref {i + 1}
                    </Chip>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <ReviewField label="Name" value={data.name} />
              <ReviewField label="Slug" value={data.slug} />
              <div>
                <p className="text-small font-medium mb-2">Palette</p>
                <div className="flex gap-2">
                  {Object.entries(data.palette).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-lg border border-divider"
                        style={{ backgroundColor: val }}
                      />
                      <span className="text-tiny text-default-400">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ReviewField
                label="Typography"
                value={`${data.typography.headline} / ${data.typography.body}`}
              />
              <ReviewField
                label="Assets"
                value={[
                  data.logoDarkR2Key && "Logo Dark",
                  data.logoLightR2Key && "Logo Light",
                  data.photoR2Key && "Photo",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              />
              <ReviewField
                label="Style Refs"
                value={`${data.refKeys.length} uploaded`}
              />
              {errors.submit && (
                <p className="text-danger text-small">{errors.submit}</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="flat"
          onPress={prev}
          isDisabled={step === 0}
          startContent={<Icon icon="solar:arrow-left-linear" width={18} />}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            color="primary"
            onPress={next}
            endContent={<Icon icon="solar:arrow-right-linear" width={18} />}
          >
            Next
          </Button>
        ) : (
          <Button
            color="primary"
            onPress={submit}
            isLoading={submitting}
            endContent={
              !submitting && <Icon icon="solar:check-circle-linear" width={18} />
            }
          >
            Create Project
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Sub-components ---

function FileUploadField({
  label,
  description,
  accept,
  uploaded,
  uploading,
  error,
  onFile,
}: {
  label: string;
  description?: string;
  accept: string;
  uploaded: boolean;
  uploading: boolean;
  error?: string;
  onFile: (file: File) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-small font-medium">{label}</p>
          {description && (
            <p className="text-tiny text-default-400">{description}</p>
          )}
        </div>
        {uploaded && (
          <Chip
            size="sm"
            color="success"
            variant="flat"
            startContent={<Icon icon="solar:check-circle-bold" width={14} />}
          >
            Uploaded
          </Chip>
        )}
      </div>
      <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-divider rounded-large cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
        {uploading ? (
          <div className="flex items-center gap-2 text-default-400">
            <Icon
              icon="solar:upload-minimalistic-linear"
              width={20}
              className="animate-bounce"
            />
            <span className="text-small">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-default-400">
            <Icon icon="solar:upload-minimalistic-linear" width={20} />
            <span className="text-small">Click to upload</span>
          </div>
        )}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-danger text-tiny">{error}</p>}
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-small font-medium text-default-400">{label}</p>
      <p className="text-small">{value}</p>
    </div>
  );
}
