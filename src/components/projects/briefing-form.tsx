"use client";

import { useState } from "react";
import { Button, Textarea, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ExtractedCreative } from "@/lib/schemas/briefing";

interface BriefingFormProps {
  projectId: string;
  onExtracted: (creatives: ExtractedCreative[]) => void;
}

export function BriefingForm({ projectId, onExtracted }: BriefingFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProcess = async () => {
    if (text.trim().length < 10) {
      setError("Briefing must be at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/briefings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: text }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Failed to process briefing");
        return;
      }

      const data = (await res.json()) as { creatives: ExtractedCreative[] };
      onExtracted(data.creatives);
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
          <h3 className="text-lg font-semibold">Briefing</h3>
          <p className="text-small text-default-500">
            Paste the marketing briefing. Claude will extract individual
            creatives with headlines, benefits, and CTAs.
          </p>
        </div>

        <Textarea
          placeholder="Cole aqui o briefing do cliente... Ex: 'Criar 3 posts sobre rinoplastia: um sobre resultado natural, outro sobre recuperação rápida, e um sobre a primeira consulta.'"
          value={text}
          onValueChange={setText}
          minRows={6}
          maxRows={15}
          isDisabled={loading}
        />

        {error && <p className="text-danger text-small">{error}</p>}

        <div className="flex justify-end">
          <Button
            color="primary"
            onPress={handleProcess}
            isLoading={loading}
            isDisabled={text.trim().length < 10}
            startContent={
              !loading && <Icon icon="solar:magic-stick-3-linear" width={18} />
            }
          >
            {loading ? "Processing with Claude..." : "Extract Creatives"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
