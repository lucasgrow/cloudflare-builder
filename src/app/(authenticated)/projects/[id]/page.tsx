"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  Chip,
  Spinner,
  Divider,
  Image,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface ProjectRef {
  id: string;
  type: string;
  label: string | null;
  r2Key: string;
}

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
  promptInjection: string;
  refs: ProjectRef[];
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
  const { uploadUrl, key } = (await res.json()) as {
    uploadUrl: string;
    key: string;
  };
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return key;
}

async function patchProject(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);

  const fetchProject = useCallback(() => {
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

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleAssetUpload = async (
    type: "logo-dark" | "logo-light" | "photo",
    file: File
  ) => {
    setUploading(type);
    try {
      const key = await uploadFile(file, `projects/${id}/assets`);
      const fieldMap: Record<string, string> = {
        "logo-dark": "logoDarkR2Key",
        "logo-light": "logoLightR2Key",
        photo: "photoR2Key",
      };
      await patchProject(id, { [fieldMap[type]]: key });
      fetchProject();
      setCacheBust((n) => n + 1);
    } finally {
      setUploading(null);
    }
  };

  const handleExtraPhotoUpload = async (file: File) => {
    setUploading("extra-photo");
    try {
      const key = await uploadFile(file, `projects/${id}/photos`);
      await fetch(`/api/projects/${id}/refs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: key,
          type: "extra_photo",
          label: file.name,
        }),
      });
      fetchProject();
      setCacheBust((n) => n + 1);
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteRef = async (refId: string) => {
    await fetch(`/api/projects/${id}/refs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refId }),
    });
    fetchProject();
  };

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
  const extraPhotos = project.refs.filter((r) => r.type === "extra_photo");
  const styleRefs = project.refs.filter((r) => r.type === "style_ref");

  return (
    <div className="space-y-6">
      {/* === LOGOS === */}
      <SectionHeader icon="solar:star-bold" title="Logos" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LogoCard
          projectId={id}
          type="logo-dark"
          label="Logo — Fundo Escuro"
          icon="solar:moon-bold"
          bgColor="#1a1a1a"
          hasAsset={hasLogoDark}
          uploading={uploading === "logo-dark"}
          onUpload={(f) => handleAssetUpload("logo-dark", f)}
          cacheBust={cacheBust}
        />
        <LogoCard
          projectId={id}
          type="logo-light"
          label="Logo — Fundo Claro"
          icon="solar:sun-bold"
          bgColor={
            project.palette.backgroundLight ??
            project.palette.light ??
            "#F5F0EB"
          }
          hasAsset={hasLogoLight}
          uploading={uploading === "logo-light"}
          onUpload={(f) => handleAssetUpload("logo-light", f)}
          cacheBust={cacheBust}
        />
      </div>

      {/* === FOTOS === */}
      <SectionHeader icon="solar:camera-bold" title="Fotos Profissionais" />
      <PhotoGallery
        projectId={id}
        mainPhotoKey={project.photoR2Key}
        extraPhotos={extraPhotos}
        uploading={uploading}
        onMainUpload={(f) => handleAssetUpload("photo", f)}
        onExtraUpload={handleExtraPhotoUpload}
        onDeleteRef={handleDeleteRef}
        cacheBust={cacheBust}
      />

      {/* === PALETA + TIPOGRAFIA === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaletteCard
          projectId={id}
          palette={project.palette}
          onUpdated={fetchProject}
        />
        <TypographyCard
          projectId={id}
          typography={project.typography}
          palette={project.palette}
          onUpdated={fetchProject}
        />
      </div>

      {/* === STATS === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="solar:gallery-bold"
          label="Criativos"
          value={project.jobsCount}
          color={project.palette.accent ?? "#B8964E"}
        />
        <StatCard
          icon="solar:camera-bold"
          label="Fotos"
          value={1 + extraPhotos.length}
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

      {/* === LOGO DESCRIPTION === */}
      {project.logoDescription && (
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
    </div>
  );
}

// --- Section Header ---

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={icon} width={18} className="text-default-400" />
      <h2 className="text-small font-semibold text-default-500 uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}

// --- Logo Card ---

function LogoCard({
  projectId,
  type,
  label,
  icon,
  bgColor,
  hasAsset,
  uploading,
  onUpload,
  cacheBust,
}: {
  projectId: string;
  type: string;
  label: string;
  icon: string;
  bgColor: string;
  hasAsset: boolean;
  uploading: boolean;
  onUpload: (f: File) => void;
  cacheBust: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border border-divider overflow-hidden">
      <CardBody className="p-0">
        <div
          className="flex items-center justify-center p-8 min-h-[200px] relative group cursor-pointer"
          style={{ backgroundColor: bgColor }}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Spinner size="lg" />
          ) : hasAsset ? (
            <>
              <Image
                src={`/api/projects/${projectId}/asset?type=${type}&v=${cacheBust}`}
                alt={label}
                className="max-h-[160px] object-contain"
                removeWrapper
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Icon
                  icon="solar:upload-bold"
                  width={32}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-default-400">
              <Icon icon="solar:upload-linear" width={36} />
              <span className="text-small">Enviar logo</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="px-4 py-2 flex items-center gap-2">
          <Icon icon={icon} width={14} className="text-default-400" />
          <span className="text-tiny text-default-500">{label}</span>
          {hasAsset && (
            <Chip size="sm" color="success" variant="flat" className="ml-auto">
              <Icon icon="solar:check-circle-bold" width={12} />
            </Chip>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// --- Photo Gallery (main + extras) ---

function PhotoGallery({
  projectId,
  mainPhotoKey,
  extraPhotos,
  uploading,
  onMainUpload,
  onExtraUpload,
  onDeleteRef,
  cacheBust,
}: {
  projectId: string;
  mainPhotoKey: string | null;
  extraPhotos: ProjectRef[];
  uploading: string | null;
  onMainUpload: (f: File) => void;
  onExtraUpload: (f: File) => void;
  onDeleteRef: (refId: string) => void;
  cacheBust: number;
}) {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const totalPhotos = (mainPhotoKey ? 1 : 0) + extraPhotos.length;
  const canAddMore = totalPhotos < 6;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Main photo */}
      <div
        className="relative group cursor-pointer rounded-xl overflow-hidden border border-divider aspect-[3/4]"
        onClick={() => mainInputRef.current?.click()}
      >
        {uploading === "photo" ? (
          <div className="w-full h-full flex items-center justify-center bg-default-100">
            <Spinner size="lg" />
          </div>
        ) : mainPhotoKey ? (
          <>
            <Image
              src={`/api/projects/${projectId}/asset?type=photo&v=${cacheBust}`}
              alt="Foto principal"
              className="w-full h-full object-cover"
              removeWrapper
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <Icon
                icon="solar:upload-bold"
                width={28}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <Chip
              size="sm"
              variant="flat"
              className="absolute top-2 left-2"
            >
              Principal
            </Chip>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-default-50 text-default-400">
            <Icon icon="solar:camera-add-linear" width={36} />
            <span className="text-small">Foto principal</span>
          </div>
        )}
        <input
          ref={mainInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onMainUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Extra photos */}
      {extraPhotos.map((photo) => (
        <div
          key={photo.id}
          className="relative group rounded-xl overflow-hidden border border-divider aspect-[3/4]"
        >
          <Image
            src={`/api/projects/${projectId}/asset?type=ref&refId=${photo.id}&v=${cacheBust}`}
            alt={photo.label ?? "Foto extra"}
            className="w-full h-full object-cover"
            removeWrapper
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <Button
              isIconOnly
              size="sm"
              color="danger"
              variant="flat"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onPress={() => onDeleteRef(photo.id)}
            >
              <Icon icon="solar:trash-bin-2-linear" width={16} />
            </Button>
          </div>
        </div>
      ))}

      {/* Add more button */}
      {canAddMore && (
        <div
          className="relative cursor-pointer rounded-xl overflow-hidden border border-dashed border-divider aspect-[3/4] flex flex-col items-center justify-center gap-2 text-default-400 hover:bg-default-50 transition-colors"
          onClick={() => extraInputRef.current?.click()}
        >
          {uploading === "extra-photo" ? (
            <Spinner size="lg" />
          ) : (
            <>
              <Icon icon="solar:add-circle-linear" width={32} />
              <span className="text-small">Adicionar foto</span>
              <span className="text-tiny text-default-300">
                {totalPhotos}/6
              </span>
            </>
          )}
          <input
            ref={extraInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onExtraUpload(f);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

// --- Palette Card ---

function PaletteCard({
  projectId,
  palette,
  onUpdated,
}: {
  projectId: string;
  palette: Record<string, string>;
  onUpdated: () => void;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editPalette, setEditPalette] = useState(palette);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await patchProject(projectId, { palette: editPalette });
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border border-divider">
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
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
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                setEditPalette(palette);
                onOpen();
              }}
              startContent={<Icon icon="solar:pen-linear" width={14} />}
            >
              Editar
            </Button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(palette).map(([key, val]) => (
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

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Editar Paleta</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(editPalette).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={val}
                    onChange={(e) =>
                      setEditPalette((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-10 h-10 rounded-lg border border-divider cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-small font-medium">
                      {PALETTE_LABELS[key] ?? key}
                    </p>
                    <Input
                      size="sm"
                      value={val}
                      onChange={(e) =>
                        setEditPalette((p) => ({
                          ...p,
                          [key]: e.target.value,
                        }))
                      }
                      classNames={{ input: "font-mono text-tiny" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// --- Typography Card (dark/light preview) ---

function TypographyCard({
  projectId,
  typography,
  palette,
  onUpdated,
}: {
  projectId: string;
  typography: { headline: string; body: string };
  palette: Record<string, string>;
  onUpdated: () => void;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editTypo, setEditTypo] = useState(typography);
  const [saving, setSaving] = useState(false);

  const darkBg = palette.primaryDark ?? palette.dark ?? "#2C2C2C";
  const lightBg = palette.backgroundLight ?? palette.light ?? "#F5F0EB";
  const textDark = palette.textDark ?? palette.text ?? "#1A1A1A";
  const textLight = palette.textLight ?? "#FFFFFF";
  const accent = palette.accent ?? "#B8964E";

  const handleSave = async () => {
    setSaving(true);
    try {
      await patchProject(projectId, { typography: editTypo });
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border border-divider">
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
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
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                setEditTypo(typography);
                onOpen();
              }}
              startContent={<Icon icon="solar:pen-linear" width={14} />}
            >
              Editar
            </Button>
          </div>

          {/* Dark theme preview */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: darkBg }}
          >
            <p className="text-tiny uppercase tracking-wider" style={{ color: accent }}>
              Fundo Escuro
            </p>
            <p
              className="text-lg font-bold leading-tight"
              style={{ color: "#FFFFFF" }}
            >
              {typography.headline}
            </p>
            <p className="text-small" style={{ color: textLight }}>
              {typography.body}
            </p>
            <span
              className="inline-block text-tiny font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: accent, color: "#FFFFFF" }}
            >
              CTA Exemplo →
            </span>
          </div>

          {/* Light theme preview */}
          <div
            className="rounded-xl p-4 space-y-2 border border-divider"
            style={{ backgroundColor: lightBg }}
          >
            <p className="text-tiny uppercase tracking-wider" style={{ color: accent }}>
              Fundo Claro
            </p>
            <p
              className="text-lg font-bold leading-tight"
              style={{ color: textDark }}
            >
              {typography.headline}
            </p>
            <p className="text-small" style={{ color: textDark, opacity: 0.7 }}>
              {typography.body}
            </p>
            <span
              className="inline-block text-tiny font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: accent, color: "#FFFFFF" }}
            >
              CTA Exemplo →
            </span>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Editar Tipografia</ModalHeader>
          <ModalBody>
            <Input
              label="Fonte de Títulos"
              value={editTypo.headline}
              onChange={(e) =>
                setEditTypo((t) => ({ ...t, headline: e.target.value }))
              }
            />
            <Input
              label="Fonte de Corpo"
              value={editTypo.body}
              onChange={(e) =>
                setEditTypo((t) => ({ ...t, body: e.target.value }))
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              Salvar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// --- Stat Card ---

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
