export interface WorkspaceOrbitNodeData {
  readonly id: string;
  readonly label: string;
  readonly angleDeg: number;
  readonly href: string;
  readonly interactive: boolean;
}

export const workspaceOrbitNodes: readonly WorkspaceOrbitNodeData[] = [
  {
    id: "orbit-procure",
    label: "Procure",
    angleDeg: 0,
    href: "/it-device-procurement",
    interactive: true,
  },
  {
    id: "orbit-rent",
    label: "Rent",
    angleDeg: 60,
    href: "/laptop-desktop-rental",
    interactive: true,
  },
  {
    id: "orbit-deploy",
    label: "Deploy",
    angleDeg: 120,
    href: "/device-as-a-service",
    interactive: true,
  },
  {
    id: "orbit-support",
    label: "Support",
    angleDeg: 180,
    href: "/resources",
    interactive: true,
  },
  {
    id: "orbit-manage",
    label: "Manage",
    angleDeg: 240,
    href: "/platform",
    interactive: true,
  },
  {
    id: "orbit-renew",
    label: "Renew",
    angleDeg: 300,
    href: "/how-it-works",
    interactive: true,
  },
] as const;