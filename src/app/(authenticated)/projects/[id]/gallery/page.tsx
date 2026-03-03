"use client";

import { useParams } from "next/navigation";
import { GalleryGrid } from "@/components/projects/gallery-grid";

export default function GalleryPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gallery</h1>
        <p className="text-default-500 text-small mt-1">
          View generated creatives. Click to view, download, or edit.
        </p>
      </div>
      <GalleryGrid projectId={id} />
    </div>
  );
}
