"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { BriefingForm } from "@/components/projects/briefing-form";
import { ReviewCards } from "@/components/projects/review-cards";
import type { ExtractedCreative } from "@/lib/schemas/briefing";

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>();
  const [creatives, setCreatives] = useState<ExtractedCreative[] | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Creatives</h1>
        <p className="text-default-500 text-small mt-1">
          Paste a briefing, review extracted creatives, then generate.
        </p>
      </div>

      {!creatives ? (
        <BriefingForm projectId={id} onExtracted={setCreatives} />
      ) : (
        <ReviewCards projectId={id} initialCreatives={creatives} />
      )}
    </div>
  );
}
