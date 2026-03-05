"use client";

import { useState } from "react";
import { Button, Textarea, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface AgentPlan {
  templateSlug: string;
  headline: string;
  benefits?: string[];
  ctaText: string;
  keywords: string[];
  reasoning: string;
}

interface AgentFormProps {
  projectId: string;
  onPlanReady: (plan: AgentPlan, refImageR2Key: string | null) => void;
}

export function AgentForm({ projectId, onPlanReady }: AgentFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TODO: ref image upload

  const handleSubmit = async () => {
    if (text.trim().length < 10) {
      setError("Descreva o criativo com pelo menos 10 caracteres.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/agent/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeText: text }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Falha ao planejar criativo");
        return;
      }

      const data = (await res.json()) as {
        plan: AgentPlan;
        refImageR2Key: string | null;
      };
      onPlanReady(data.plan, data.refImageR2Key);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody className="gap-4">
        <div>
          <h3 className="text-lg font-semibold">Modo Agente</h3>
          <p className="text-small text-default-500">
            Descreva o que você quer e o agente vai planejar o criativo
            automaticamente.
          </p>
        </div>

        <Textarea
          label="Brief"
          placeholder="Ex: 'Quero um post sobre rinoplastia focando em resultado natural, para mulheres 25-40 anos que têm medo de ficar artificial.'"
          value={text}
          onValueChange={setText}
          minRows={4}
          maxRows={10}
          isDisabled={loading}
        />

        {error && <p className="text-danger text-small">{error}</p>}

        <div className="flex justify-end">
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={loading}
            isDisabled={text.trim().length < 10}
            startContent={
              !loading && <Icon icon="solar:magic-stick-3-linear" width={18} />
            }
          >
            {loading ? "Agente pensando..." : "Planejar criativo"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
