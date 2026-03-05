"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Image,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface Job {
  id: string;
  headline: string;
  ctaText: string;
  outputUrl?: string | null;
  outputR2Key: string | null;
}

interface CreativeViewerProps {
  job: Job;
  projectId: string;
  onClose: () => void;
  onJobCreated: () => void;
}

export function CreativeViewer({
  job,
  projectId,
  onClose,
  onJobCreated,
}: CreativeViewerProps) {
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentJobId: job.id,
          editPrompt: editPrompt.trim(),
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error || "Failed to create edit job");
        return;
      }

      onJobCreated();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!job.outputUrl) return;
    const a = document.createElement("a");
    a.href = job.outputUrl;
    a.download = `${job.headline.replace(/\s+/g, "-").toLowerCase()}.jpg`;
    a.click();
  };

  return (
    <Modal isOpen onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">{job.headline}</h3>
          <p className="text-small text-default-400 font-normal">
            {job.ctaText}
          </p>
        </ModalHeader>

        <ModalBody>
          {job.outputUrl && (
            <Image
              src={job.outputUrl}
              alt={job.headline}
              className="w-full rounded-large"
              removeWrapper
            />
          )}

          {editMode && (
            <>
              <Divider />
              <div className="space-y-3">
                <p className="text-small font-medium">Edit Instruction</p>
                <Input
                  placeholder='Ex: "headline maior", "CTA em verde", "remover foto"'
                  value={editPrompt}
                  onValueChange={setEditPrompt}
                  description="Describe what to change. A new version will be generated."
                />
                {error && <p className="text-danger text-small">{error}</p>}
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          {editMode ? (
            <>
              <Button
                variant="flat"
                onPress={() => {
                  setEditMode(false);
                  setEditPrompt("");
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleEdit}
                isLoading={submitting}
                isDisabled={!editPrompt.trim()}
              >
                Generate Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="flat"
                onPress={handleDownload}
                startContent={
                  <Icon icon="solar:download-minimalistic-linear" width={18} />
                }
              >
                Download
              </Button>
              <Button
                color="primary"
                variant="flat"
                onPress={() => setEditMode(true)}
                startContent={
                  <Icon icon="solar:pen-new-square-linear" width={18} />
                }
              >
                Edit
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
