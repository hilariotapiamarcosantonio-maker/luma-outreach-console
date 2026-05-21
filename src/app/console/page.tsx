import { redirect } from "next/navigation";
import { DEFAULT_WORKSPACE } from "@/config/workspaces";

export default function ConsoleIndexPage() {
  redirect(`/console/${DEFAULT_WORKSPACE.workspaceSlug}`);
}
