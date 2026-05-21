import { LumaOutreachConsole } from "@/components/LumaOutreachConsole";

interface BatchPageProps {
  params: Promise<{
    workspaceSlug: string;
    batchId: string;
  }>;
}

export default async function WorkspaceBatchPage({ params }: BatchPageProps) {
  const { workspaceSlug, batchId } = await params;

  return (
    <LumaOutreachConsole
      workspaceSlug={workspaceSlug}
      initialView="today"
      routeBatchId={batchId}
    />
  );
}
