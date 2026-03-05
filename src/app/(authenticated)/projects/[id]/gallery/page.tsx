"use client";

import { useParams } from "next/navigation";
import { GalleryGrid } from "@/components/projects/gallery-grid";

export default function GalleryPage() {
  const { id } = useParams<{ id: string }>();

  return <GalleryGrid projectId={id} />;
}
