"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import type { AgentPlan } from "./agent-form";

interface Template {
  id: string;
  name: string;
  slug: string;
  layoutDescription: string | null;
}

interface PlanPreviewProps {
  projectId: string;
  plan: AgentPlan;
  refImageR2Key: string | null;
  onBack: () => void;
}

export function AgentPlanPreview({
  projectId,
  plan,
  refImageR2Key: _refImageR2Key,
  onBack,
}: PlanPreviewProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [headline, setHeadline] = useState(plan.headline);
  const [benefits, setBenefits] = useState<string[]>(
    plan.benefits?.length ? [...plan.benefits] : ["", "", ""]
  );
  const [ctaText, setCtaText] = useState(plan.ctaText);
  const [keywords, setKeywords] = useState(plan.keywords.join(", "));

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json() as Promise<Template[]>)
      .then(setTemplates);
  }, []);

  const updateBenefit = (index: number, value: string) => {
    setBenefits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const tpl = templates.find((t) => t.slug === plan.templateSlug);

  const handleApprove = async () => {
    const resolvedTpl = tpl ?? templates[0];
    if (!resolvedTpl) {
      setError("Nenhum template disponivel.");
      return;
    }
    if (!headline || !ctaText) {
      setError("Headline e CTA sao obrigatorios.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: [
            {
              templateId: resolvedTpl.id,
              headline,
              benefits: benefits.filter(Boolean),
              ctaText,
              keywords: keywords
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Falha ao criar job");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plano do Agente</h3>
          <p className="text-small text-default-500">{plan.reasoning}</p>
        </div>
        <Button variant="flat" size="sm" onPress={onBack}>
          <Icon icon="solar:arrow-left-linear" width={16} />
          Voltar
        </Button>
      </div>

      {/* Plan card */}
      <Card className="border border-divider">
        <CardBody className="gap-4">
          {/* Template */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip size="sm" variant="flat" color="primary">
              {tpl?.name ?? plan.templateSlug}
            </Chip>
            {tpl?.layoutDescription && (
              <span className="text-small text-default-400">
                {tpl.layoutDescription}
              </span>
            )}
          </div>

          {editing ? (
            <>
              {/* Editable fields */}
              <Input
                label="Headline"
                value={headline}
                onValueChange={setHeadline}
                size="sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    label={`Beneficio ${i + 1}`}
                    value={benefits[i] ?? ""}
                    onValueChange={(v) => updateBenefit(i, v)}
                    size="sm"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  label="CTA"
                  value={ctaText}
                  onValueChange={setCtaText}
                  size="sm"
                />
                <Input
                  label="Keywords (separadas por virgula)"
                  value={keywords}
                  onValueChange={setKeywords}
                  size="sm"
                />
              </div>
            </>
          ) : (
            <>
              {/* View mode */}
              <p className="text-xl font-bold">{headline}</p>

              <div className="space-y-1">
                {benefits.filter(Boolean).map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Icon
                      icon="solar:check-circle-linear"
                      className="text-success"
                      width={18}
                    />
                    <span className="text-small">{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Chip size="sm" variant="flat">
                  {ctaText}
                </Chip>
                {keywords
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
                  .map((kw) => (
                    <Chip key={kw} size="sm" variant="dot" color="warning">
                      {kw}
                    </Chip>
                  ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {error && <p className="text-danger text-small">{error}</p>}

      <Divider />

      {/* Footer */}
      <div className="flex justify-end gap-2">
        <Button
          variant="flat"
          size="sm"
          onPress={() => setEditing((v) => !v)}
        >
          {editing ? "Preview" : "Editar"}
        </Button>
        <Button
          color="primary"
          size="lg"
          onPress={handleApprove}
          isLoading={submitting}
          startContent={
            !submitting && (
              <Icon icon="solar:play-circle-linear" width={20} />
            )
          }
        >
          Aprovar & Gerar
        </Button>
      </div>
    </div>
  );
}
