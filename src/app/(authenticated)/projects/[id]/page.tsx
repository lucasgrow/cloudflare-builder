"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody, Chip, Spinner, Divider, Image } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  palette: Record<string, string>;
  typography: { headline: string; body: string };
  logoDescription: string | null;
  logoDarkR2Key: string | null;
  logoLightR2Key: string | null;
  photoR2Key: string | null;
  refsCount: number;
  jobsCount: number;
  createdAt: string;
}

const PALETTE_LABELS: Record<string, string> = {
  primaryDark: "Primária",
  accent: "Destaque",
  backgroundLight: "Fundo",
  textDark: "Texto",
  textLight: "Texto Claro",
  dark: "Escuro",
  light: "Claro",
  text: "Texto",
  muted: "Suave",
};

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
      .then((data) => {
        if (data) setProject(data);
      })
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

  const hasLogoDark = !!project.logoDarkR2Key;
  const hasLogoLight = !!project.logoLightR2Key;
  const hasPhoto = !!project.photoR2Key;
  const hasAnyAsset = hasLogoDark || hasLogoLight || hasPhoto;

  return (
    <div className="space-y-6">
      {/* Hero: Logos side by side */}
      {(hasLogoDark || hasLogoLight) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hasLogoDark && (
            <Card className="border border-divider overflow-hidden">
              <CardBody className="p-0">
                <div className="bg-[#1a1a1a] flex items-center justify-center p-8 min-h-[200px]">
                  <Image
                    src={`/api/projects/${id}/asset?type=logo-dark`}
                    alt="Logo (fundo escuro)"
                    className="max-h-[160px] object-contain"
                    removeWrapper
                  />
                </div>
                <div className="px-4 py-2 flex items-center gap-2">
                  <Icon
                    icon="solar:moon-bold"
                    width={14}
                    className="text-default-400"
                  />
                  <span className="text-tiny text-default-500">
                    Logo — Fundo Escuro
                  </span>
                </div>
              </CardBody>
            </Card>
          )}
          {hasLogoLight && (
            <Card className="border border-divider overflow-hidden">
              <CardBody className="p-0">
                <div
                  className="flex items-center justify-center p-8 min-h-[200px]"
                  style={{
                    backgroundColor:
                      project.palette.backgroundLight ??
                      project.palette.light ??
                      "#F5F0EB",
                  }}
                >
                  <Image
                    src={`/api/projects/${id}/asset?type=logo-light`}
                    alt="Logo (fundo claro)"
                    className="max-h-[160px] object-contain"
                    removeWrapper
                  />
                </div>
                <div className="px-4 py-2 flex items-center gap-2">
                  <Icon
                    icon="solar:sun-bold"
                    width={14}
                    className="text-default-400"
                  />
                  <span className="text-tiny text-default-500">
                    Logo — Fundo Claro
                  </span>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Professional Photo */}
      {hasPhoto && (
        <Card className="border border-divider overflow-hidden">
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-1">
                <Image
                  src={`/api/projects/${id}/asset?type=photo`}
                  alt="Foto profissional"
                  className="w-full h-full object-cover aspect-[3/4] md:aspect-auto"
                  removeWrapper
                />
              </div>
              <div className="md:col-span-2 flex flex-col justify-center p-6 gap-4">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:camera-bold"
                    width={18}
                    className="text-default-400"
                  />
                  <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
                    Foto Profissional
                  </h3>
                </div>
                {project.logoDescription && (
                  <p className="text-default-600 text-small leading-relaxed">
                    {project.logoDescription}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Chip size="sm" variant="flat" color="success">
                    <span className="flex items-center gap-1">
                      <Icon icon="solar:check-circle-bold" width={12} />
                      Foto enviada
                    </span>
                  </Chip>
                  {hasLogoDark && (
                    <Chip size="sm" variant="flat" color="success">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:check-circle-bold" width={12} />
                        Logo dark
                      </span>
                    </Chip>
                  )}
                  {hasLogoLight && (
                    <Chip size="sm" variant="flat" color="success">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:check-circle-bold" width={12} />
                        Logo light
                      </span>
                    </Chip>
                  )}
                  <Chip size="sm" variant="flat">
                    {project.refsCount} referências
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Palette + Typography row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Palette */}
        <Card className="border border-divider">
          <CardBody className="gap-4">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:palette-bold"
                width={18}
                className="text-default-400"
              />
              <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
                Paleta de Cores
              </h3>
            </div>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(project.palette).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-12 h-12 rounded-xl border border-divider shadow-sm"
                    style={{ backgroundColor: val }}
                  />
                  <span className="text-tiny text-default-400">
                    {PALETTE_LABELS[key] ?? key}
                  </span>
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
          <CardBody className="gap-4">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:text-bold"
                width={18}
                className="text-default-400"
              />
              <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
                Tipografia
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-tiny text-default-400 mb-1">Títulos</p>
                <p
                  className="text-xl font-bold"
                  style={{
                    color:
                      project.palette.textDark ??
                      project.palette.text ??
                      "#1A1A1A",
                  }}
                >
                  {project.typography.headline}
                </p>
              </div>
              <Divider />
              <div>
                <p className="text-tiny text-default-400 mb-1">Corpo</p>
                <p className="text-medium">{project.typography.body}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="solar:gallery-bold"
          label="Criativos"
          value={project.jobsCount}
          color={project.palette.accent ?? "#B8964E"}
        />
        <StatCard
          icon="solar:image-bold"
          label="Assets"
          value={
            (hasLogoDark ? 1 : 0) +
            (hasLogoLight ? 1 : 0) +
            (hasPhoto ? 1 : 0) +
            project.refsCount
          }
          color={project.palette.accent ?? "#B8964E"}
        />
        <StatCard
          icon="solar:pallete-2-bold"
          label="Cores"
          value={Object.keys(project.palette).length}
          color={project.palette.accent ?? "#B8964E"}
        />
        <StatCard
          icon="solar:calendar-bold"
          label="Criado em"
          value={new Date(project.createdAt).toLocaleDateString("pt-BR")}
          color={project.palette.accent ?? "#B8964E"}
        />
      </div>

      {/* Logo description if no photo section showed it */}
      {!hasPhoto && project.logoDescription && (
        <Card className="border border-divider">
          <CardBody className="gap-3">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:document-text-bold"
                width={18}
                className="text-default-400"
              />
              <h3 className="text-small font-semibold text-default-500 uppercase tracking-wider">
                Descrição da Marca
              </h3>
            </div>
            <p className="text-default-600 text-small leading-relaxed">
              {project.logoDescription}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Empty state for assets */}
      {!hasAnyAsset && (
        <Card className="border border-dashed border-divider">
          <CardBody className="flex flex-col items-center justify-center py-12 gap-3">
            <Icon
              icon="solar:gallery-add-linear"
              width={48}
              className="text-default-300"
            />
            <p className="text-default-500 font-medium">
              Nenhum asset enviado
            </p>
            <p className="text-small text-default-400 text-center max-w-sm">
              Faça upload de logos e fotos profissionais para usar nos criativos.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border border-divider">
      <CardBody className="flex flex-row items-center gap-3 py-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon icon={icon} width={20} style={{ color }} />
        </div>
        <div>
          <p className="text-tiny text-default-400">{label}</p>
          <p className="font-semibold">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}
