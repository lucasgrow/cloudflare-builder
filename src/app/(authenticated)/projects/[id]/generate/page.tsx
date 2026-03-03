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
    <div className="space-y-6">
      {!creatives ? (
        <BriefingForm projectId={id} onExtracted={setCreatives} />
      ) : (
        <ReviewCards projectId={id} initialCreatives={creatives} />
      )}
    </div>
  );
}
