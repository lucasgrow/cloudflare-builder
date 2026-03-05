"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Tabs, Tab, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  slug: string;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json() as Promise<Project>)
      .then(setProject);
  }, [id]);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname.endsWith("/generate")) return "generate";
    if (pathname.endsWith("/gallery")) return "gallery";
    return "overview";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Project header */}
      <div>
        {project ? (
          <h1 className="text-2xl font-bold">{project.name}</h1>
        ) : (
          <Spinner size="sm" />
        )}
      </div>

      {/* Sub-navigation tabs */}
      <Tabs
        selectedKey={getActiveTab()}
        variant="underlined"
        classNames={{ tabList: "gap-6" }}
      >
        <Tab
          key="overview"
          as={Link}
          href={`/projects/${id}`}
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:info-circle-linear" width={18} />
              <span>Overview</span>
            </div>
          }
        />
        <Tab
          key="generate"
          as={Link}
          href={`/projects/${id}/generate`}
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:magic-stick-3-linear" width={18} />
              <span>Generate</span>
            </div>
          }
        />
        <Tab
          key="gallery"
          as={Link}
          href={`/projects/${id}/gallery`}
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:gallery-linear" width={18} />
              <span>Gallery</span>
            </div>
          }
        />
      </Tabs>

      {/* Page content */}
      {children}
    </div>
  );
}
