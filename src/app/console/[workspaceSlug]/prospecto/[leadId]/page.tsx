import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface LeadPageProps {
  params: Promise<{
    workspaceSlug: string;
    leadId: string;
  }>;
}

export default async function WorkspaceLeadPage({ params }: LeadPageProps) {
  const { workspaceSlug, leadId } = await params;

  return (
    <LumaOutreachConsole
      workspaceSlug={workspaceSlug}
      initialView="prospects"
      routeLeadId={leadId}
    />
  );
}
