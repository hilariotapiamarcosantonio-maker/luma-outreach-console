import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";
import { NICHES } from "@/data/niches";
import type { NicheKey } from "@/types";

interface NichePageProps {
  params: Promise<{
    workspaceSlug: string;
    nicheId: string;
  }>;
}

export default async function WorkspaceNichePage({ params }: NichePageProps) {
  const { workspaceSlug, nicheId } = await params;
  const initialNiche = NICHES.some((niche) => niche.key === nicheId) ? (nicheId as NicheKey) : "all";

  return (
    <LumaOutreachConsole
      workspaceSlug={workspaceSlug}
      initialView="prospects"
      initialNiche={initialNiche}
    />
  );
}
