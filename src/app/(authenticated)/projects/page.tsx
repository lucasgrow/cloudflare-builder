"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  paletteJson: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json() as Promise<Project[]>)
      .then((data) => setProjects(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-default-500 text-small mt-1">
            Manage your creative projects
          </p>
        </div>
        <Button
          as={Link}
          href="/projects/new"
          color="primary"
          startContent={<Icon icon="solar:add-circle-linear" width={20} />}
        >
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border border-dashed border-divider">
          <CardBody className="flex flex-col items-center justify-center py-16 gap-4">
            <Icon
              icon="solar:folder-open-linear"
              width={48}
              className="text-default-300"
            />
            <p className="text-default-500">No projects yet</p>
            <Button
              as={Link}
              href="/projects/new"
              color="primary"
              variant="flat"
              startContent={<Icon icon="solar:add-circle-linear" width={18} />}
            >
              Create your first project
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            let palette: { accent?: string; dark?: string } = {};
            try {
              palette = JSON.parse(project.paletteJson);
            } catch {
              // ignore
            }
            return (
              <Card
                key={project.id}
                as={Link}
                href={`/projects/${project.id}`}
                isPressable
                className="border border-divider hover:border-primary transition-colors"
              >
                <CardBody className="gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-tiny text-default-400">
                        {project.slug}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {palette.accent && (
                        <div
                          className="w-4 h-4 rounded-full border border-divider"
                          style={{ backgroundColor: palette.accent }}
                        />
                      )}
                      {palette.dark && (
                        <div
                          className="w-4 h-4 rounded-full border border-divider"
                          style={{ backgroundColor: palette.dark }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat">
                      {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
