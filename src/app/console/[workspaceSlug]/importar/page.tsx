import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface ImportPageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceImportPage({ params }: ImportPageProps) {
  const { workspaceSlug } = await params;
  return <LumaOutreachConsole workspaceSlug={workspaceSlug} initialView="import" />;
}
