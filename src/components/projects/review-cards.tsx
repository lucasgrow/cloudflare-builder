"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import type { ExtractedCreative } from "@/lib/schemas/briefing";

interface Template {
  id: string;
  name: string;
  slug: string;
  layoutDescription: string | null;
}

interface EditableCreative extends ExtractedCreative {
  _key: string;
}

interface ReviewCardsProps {
  projectId: string;
  initialCreatives: ExtractedCreative[];
}

export function ReviewCards({ projectId, initialCreatives }: ReviewCardsProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [creatives, setCreatives] = useState<EditableCreative[]>(() =>
    initialCreatives.map((c) => ({ ...c, _key: crypto.randomUUID() }))
  );

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json() as Promise<Template[]>)
      .then(setTemplates);
  }, []);

  const updateCreative = (key: string, field: keyof ExtractedCreative, value: unknown) => {
    setCreatives((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    );
  };

  const updateBenefit = (key: string, index: number, value: string) => {
    setCreatives((prev) =>
      prev.map((c) => {
        if (c._key !== key) return c;
        const benefits = [...c.benefits];
        benefits[index] = value;
        return { ...c, benefits };
      })
    );
  };

  const removeCreative = (key: string) => {
    setCreatives((prev) => prev.filter((c) => c._key !== key));
  };

  const addCreative = () => {
    setCreatives((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        headline: "",
        benefits: ["", "", ""],
        ctaText: "",
        keywords: [],
        suggestedTemplate: templates[0]?.slug ?? "checklist-split",
      },
    ]);
  };

  const handleApprove = async () => {
    if (creatives.length === 0) return;

    // Resolve template slugs to IDs
    const jobs = creatives.map((c) => {
      const tpl = templates.find((t) => t.slug === c.suggestedTemplate);
      return {
        templateId: tpl?.id ?? templates[0]?.id ?? "",
        headline: c.headline,
        benefits: c.benefits.filter(Boolean),
        ctaText: c.ctaText,
        keywords: c.keywords.filter(Boolean),
      };
    });

    const invalid = jobs.some((j) => !j.templateId || !j.headline || !j.ctaText);
    if (invalid) {
      setError("All creatives need headline, CTA, and a valid template.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Failed to create jobs");
        return;
      }

      router.push(`/projects/${projectId}/gallery`);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Review Creatives ({creatives.length})
          </h3>
          <p className="text-small text-default-500">
            Edit, remove, or add creatives before generating.
          </p>
        </div>
        <Button
          variant="flat"
          size="sm"
          onPress={addCreative}
          startContent={<Icon icon="solar:add-circle-linear" width={16} />}
        >
          Add
        </Button>
      </div>

      {creatives.map((creative, idx) => (
        <Card key={creative._key} className="border border-divider">
          <CardBody className="gap-3">
            <div className="flex items-center justify-between">
              <Chip size="sm" variant="flat" color="primary">
                Creative {idx + 1}
              </Chip>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                color="danger"
                onPress={() => removeCreative(creative._key)}
              >
                <Icon icon="solar:trash-bin-2-linear" width={16} />
              </Button>
            </div>

            <Input
              label="Headline"
              value={creative.headline}
              onValueChange={(v) =>
                updateCreative(creative._key, "headline", v)
              }
              size="sm"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  label={`Benefit ${i + 1}`}
                  value={creative.benefits[i] ?? ""}
                  onValueChange={(v) => updateBenefit(creative._key, i, v)}
                  size="sm"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                label="CTA"
                value={creative.ctaText}
                onValueChange={(v) =>
                  updateCreative(creative._key, "ctaText", v)
                }
                size="sm"
              />
              <Input
                label="Keywords (comma-separated)"
                value={creative.keywords.join(", ")}
                onValueChange={(v) =>
                  updateCreative(
                    creative._key,
                    "keywords",
                    v
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                size="sm"
              />
            </div>

            {templates.length > 0 && (
              <Select
                label="Template"
                selectedKeys={[creative.suggestedTemplate]}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  if (val)
                    updateCreative(creative._key, "suggestedTemplate", val);
                }}
                size="sm"
              >
                {templates.map((t) => (
                  <SelectItem key={t.slug} textValue={t.name}>
                    <div>
                      <p className="text-small font-medium">{t.name}</p>
                      {t.layoutDescription && (
                        <p className="text-tiny text-default-400">
                          {t.layoutDescription}
                        </p>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </Select>
            )}
          </CardBody>
        </Card>
      ))}

      {error && <p className="text-danger text-small">{error}</p>}

      <Divider />

      <div className="flex justify-end gap-2">
        <Button
          color="primary"
          size="lg"
          onPress={handleApprove}
          isLoading={submitting}
          isDisabled={creatives.length === 0}
          startContent={
            !submitting && (
              <Icon icon="solar:play-circle-linear" width={20} />
            )
          }
        >
          Approve & Generate ({creatives.length})
        </Button>
      </div>
    </div>
  );
}
