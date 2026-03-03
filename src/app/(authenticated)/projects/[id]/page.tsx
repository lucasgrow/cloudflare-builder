"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, Chip, Spinner, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  palette: { accent: string; dark: string; light: string; text: string; muted: string };
  typography: { headline: string; body: string };
  logoDescription: string | null;
  logoDarkR2Key: string | null;
  logoLightR2Key: string | null;
  photoR2Key: string | null;
  refsCount: number;
  jobsCount: number;
  createdAt: string;
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json() as Promise<ProjectDetail>;
      })
      .then((data) => { if (data) setProject(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-danger">Project not found</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Palette */}
      <Card className="border border-divider">
        <CardBody className="gap-3">
          <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
            Palette
          </h3>
          <div className="flex gap-3">
            {Object.entries(project.palette).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="w-10 h-10 rounded-large border border-divider shadow-sm"
                  style={{ backgroundColor: val }}
                />
                <span className="text-tiny text-default-400">{key}</span>
                <span className="text-tiny text-default-500 font-mono">
                  {val}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Typography */}
      <Card className="border border-divider">
        <CardBody className="gap-3">
          <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
            Typography
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-tiny text-default-400">Headline</p>
              <p className="font-semibold">{project.typography.headline}</p>
            </div>
            <div>
              <p className="text-tiny text-default-400">Body</p>
              <p>{project.typography.body}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assets */}
      <Card className="border border-divider">
        <CardBody className="gap-3">
          <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
            Assets
          </h3>
          <div className="flex flex-wrap gap-2">
            <AssetChip label="Logo Dark" present={!!project.logoDarkR2Key} />
            <AssetChip label="Logo Light" present={!!project.logoLightR2Key} />
            <AssetChip label="Photo" present={!!project.photoR2Key} />
            <Chip size="sm" variant="flat">
              {project.refsCount} style refs
            </Chip>
          </div>
          {project.logoDescription && (
            <>
              <Divider />
              <div>
                <p className="text-tiny text-default-400">Logo Description</p>
                <p className="text-small">{project.logoDescription}</p>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Stats */}
      <Card className="border border-divider">
        <CardBody className="gap-3">
          <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
            Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatItem
              icon="solar:gallery-linear"
              label="Total Jobs"
              value={project.jobsCount}
            />
            <StatItem
              icon="solar:calendar-linear"
              label="Created"
              value={new Date(project.createdAt).toLocaleDateString("pt-BR")}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AssetChip({ label, present }: { label: string; present: boolean }) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={present ? "success" : "default"}
      startContent={
        <Icon
          icon={present ? "solar:check-circle-bold" : "solar:close-circle-linear"}
          width={14}
        />
      }
    >
      {label}
    </Chip>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-large bg-default-100">
        <Icon icon={icon} width={20} className="text-default-500" />
      </div>
      <div>
        <p className="text-tiny text-default-400">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
