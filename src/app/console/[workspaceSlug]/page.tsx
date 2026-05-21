import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface WorkspacePageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceConsolePage({ params }: WorkspacePageProps) {
  const { workspaceSlug } = await params;
  return <LumaOutreachConsole workspaceSlug={workspaceSlug} />;
}
