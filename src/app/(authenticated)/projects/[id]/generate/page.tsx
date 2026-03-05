"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { BriefingForm } from "@/components/projects/briefing-form";
import { ReviewCards } from "@/components/projects/review-cards";
import { AgentForm } from "@/components/projects/agent-form";
import { AgentPlanPreview } from "@/components/projects/agent-plan-preview";
import type { ExtractedCreative } from "@/lib/schemas/briefing";
import type { AgentPlan } from "@/components/projects/agent-form";

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>();

  // Structured mode state
  const [creatives, setCreatives] = useState<ExtractedCreative[] | null>(null);

  // Agent mode state
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [refImageR2Key, setRefImageR2Key] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Tabs aria-label="Generation mode" variant="underlined" color="primary">
        <Tab
          key="structured"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:list-check-linear" width={18} />
              <span>Estruturado</span>
            </div>
          }
        >
          {!creatives ? (
            <BriefingForm projectId={id} onExtracted={setCreatives} />
          ) : (
            <ReviewCards projectId={id} initialCreatives={creatives} />
          )}
        </Tab>

        <Tab
          key="agent"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:magic-stick-3-linear" width={18} />
              <span>Agente</span>
            </div>
          }
        >
          {!agentPlan ? (
            <AgentForm
              projectId={id}
              onPlanReady={(plan, ref) => {
                setAgentPlan(plan);
                setRefImageR2Key(ref);
              }}
            />
          ) : (
            <AgentPlanPreview
              projectId={id}
              plan={agentPlan}
              refImageR2Key={refImageR2Key}
              onBack={() => setAgentPlan(null)}
            />
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
