"use client";

import { useState, useRef } from "react";
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

async function uploadFile(file: File, prefix: string): Promise<string> {
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

export function AgentForm({ projectId, onPlanReady }: AgentFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refImageR2Key, setRefImageR2Key] = useState<string | null>(null);
  const [refImageName, setRefImageName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const key = await uploadFile(file, `projects/${projectId}/refs`);
      setRefImageR2Key(key);
      setRefImageName(file.name);
    } catch {
      setError("Falha ao enviar imagem de referência");
    } finally {
      setUploading(false);
    }
  };

  const removeRefImage = () => {
    setRefImageR2Key(null);
    setRefImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        body: JSON.stringify({ freeText: text, refImageR2Key }),
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

        <div className="flex flex-col gap-2">
          <p className="text-small text-default-500">
            Imagem de referência (opcional)
          </p>
          {refImageName ? (
            <div className="flex items-center gap-2">
              <Icon icon="solar:image-linear" width={18} className="text-success" />
              <span className="text-small truncate">{refImageName}</span>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onPress={removeRefImage}
                isDisabled={loading}
              >
                <Icon icon="solar:close-circle-linear" width={16} />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="flat"
              onPress={() => fileInputRef.current?.click()}
              isLoading={uploading}
              isDisabled={loading || uploading}
              startContent={
                !uploading && <Icon icon="solar:upload-linear" width={16} />
              }
            >
              {uploading ? "Enviando..." : "Enviar imagem"}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleRefImage}
          />
        </div>

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
