import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface FollowupPageProps {
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceFollowupPage({ params }: FollowupPageProps) {
  const { workspaceSlug } = await params;
  return <LumaOutreachConsole workspaceSlug={workspaceSlug} initialView="followup" />;
}
