import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface SettingsPageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  const { workspaceSlug } = await params;
  return <LumaOutreachConsole workspaceSlug={workspaceSlug} initialView="settings" />;
}
