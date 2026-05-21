import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface ProposalsPageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceProposalsPage({ params }: ProposalsPageProps) {
  const { workspaceSlug } = await params;
  return <LumaOutreachConsole workspaceSlug={workspaceSlug} initialView="proposals" />;
}
