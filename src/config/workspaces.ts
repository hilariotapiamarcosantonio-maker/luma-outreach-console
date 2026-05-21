import type { NicheKey } from "@/types";

export type WorkspaceMode = "local-first";

export interface WorkspaceConfig {
  workspaceSlug: string;
  brandName: string;
  companyName: string;
  operatorName: string;
  mode: WorkspaceMode;
  defaultGoal: string;
  defaultGoalAmount: number;
  defaultDailyContactGoal: string;
  enabledNiches: NicheKey[];
}

export const DEFAULT_WORKSPACE: WorkspaceConfig = {
  workspaceSlug: "luma-premium",
  brandName: "Luma Outreach Console",
  companyName: "Luma Premium",
  operatorName: "Marcos Hilario",
  mode: "local-first",
  defaultGoal: "RD$150,000+",
  defaultGoalAmount: 150000,
  defaultDailyContactGoal: "50-100",
  enabledNiches: [
    "real_estate",
    "developers",
    "academy",
    "beauty",
    "route_products",
    "printing_graphics",
    "professional_services",
    "b2b_services",
  ],
};

export const WORKSPACES: Record<string, WorkspaceConfig> = {
  [DEFAULT_WORKSPACE.workspaceSlug]: DEFAULT_WORKSPACE,
};

export function getWorkspaceConfig(workspaceSlug?: string) {
  if (!workspaceSlug) return DEFAULT_WORKSPACE;
  return WORKSPACES[workspaceSlug] ?? {
    ...DEFAULT_WORKSPACE,
    workspaceSlug,
  };
}
