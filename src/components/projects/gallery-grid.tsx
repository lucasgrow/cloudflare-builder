"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardBody, Chip, Spinner, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { CreativeViewer } from "./creative-viewer";

interface Job {
  id: string;
  headline: string;
  ctaText: string;
  status: string;
  errorMessage: string | null;
  outputR2Key: string | null;
  outputUrl?: string | null;
  parentJobId: string | null;
  editPrompt: string | null;
  createdAt: string;
}

interface GalleryGridProps {
  projectId: string;
}

const STATUS_CONFIG: Record<string, { color: "warning" | "primary" | "success" | "danger"; icon: string; label: string }> = {
  queued: { color: "primary", icon: "solar:refresh-circle-linear", label: "Gerando..." },
  processing: { color: "primary", icon: "solar:refresh-circle-linear", label: "Gerando..." },
  done: { color: "success", icon: "solar:check-circle-linear", label: "Pronto" },
  failed: { color: "danger", icon: "solar:close-circle-linear", label: "Erro" },
};

export function GalleryGrid({ projectId }: GalleryGridProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`);
      const data = (await res.json()) as Job[];
      setJobs(data);

      // Stop polling if all jobs are done/failed
      const hasPending = data.some(
        (j) => j.status === "queued" || j.status === "processing"
      );
      if (!hasPending && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch {
      // silent fail on poll
    }
  }, [projectId]);

  useEffect(() => {
    fetchJobs().then(() => setLoading(false));

    intervalRef.current = setInterval(fetchJobs, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  const handleJobUpdated = useCallback(() => {
    // Restart polling after edit
    fetchJobs();
    if (!intervalRef.current) {
      intervalRef.current = setInterval(fetchJobs, 5000);
    }
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className="border border-dashed border-divider">
        <CardBody className="flex flex-col items-center justify-center py-16 gap-4">
          <Icon icon="solar:gallery-linear" width={48} className="text-default-300" />
          <p className="text-default-500">No creatives yet</p>
          <p className="text-small text-default-400">
            Go to Generate to create your first creatives.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {jobs.map((job) => {
          const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.queued;
          return (
            <Card
              key={job.id}
              isPressable={job.status === "done"}
              onPress={() => job.status === "done" && setSelectedJob(job)}
              className="border border-divider overflow-hidden"
            >
              <CardBody className="p-0">
                {job.status === "done" && job.outputUrl ? (
                  <Image
                    src={job.outputUrl}
                    alt={job.headline}
                    className="w-full aspect-[3/4] object-cover"
                    removeWrapper
                  />
                ) : (
                  <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-default-50">
                    {(job.status === "processing" || job.status === "queued") ? (
                      <Spinner size="lg" />
                    ) : (
                      <Icon
                        icon={config.icon}
                        width={32}
                        className={`text-${config.color}`}
                      />
                    )}
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <p className="text-tiny font-medium truncate">
                    {job.headline}
                  </p>
                  <div className="flex items-center justify-between">
                    <Chip
                      size="sm"
                      color={config.color}
                      variant="flat"
                      startContent={<Icon icon={config.icon} width={12} />}
                    >
                      {config.label}
                    </Chip>
                    {job.parentJobId && (
                      <Chip size="sm" variant="flat">
                        edit
                      </Chip>
                    )}
                  </div>
                  {job.errorMessage && (
                    <p className="text-tiny text-danger truncate">
                      {job.errorMessage}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {selectedJob && (
        <CreativeViewer
          job={selectedJob}
          projectId={projectId}
          onClose={() => setSelectedJob(null)}
          onJobCreated={handleJobUpdated}
        />
      )}
    </>
  );
}
