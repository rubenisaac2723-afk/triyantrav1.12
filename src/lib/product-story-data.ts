export interface ProductStoryStepData {
  readonly id: "rent" | "procure" | "manage";
  readonly number: string;
  readonly label: string;
  readonly tagline: string;
  readonly summary: string;
  readonly workflowChain: string;
  readonly capabilities: readonly string[];
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly portalType: "client" | "central" | "supplier";
  readonly visualBadge: string;
  readonly visualTitle: string;
  readonly visualSubtitle: string;
  readonly metrics: readonly (readonly [string, string])[];
  readonly records: readonly {
    readonly id: string;
    readonly title: string;
    readonly detail: string;
    readonly status: string;
    readonly statusType: "assigned" | "available" | "matching" | "review" | "pending";
  }[];
  readonly architecturalNote: string;
}

export const productStorySteps: readonly ProductStoryStepData[] = [
  {
    id: "rent",
    number: "01",
    label: "Rent",
    tagline: "Equip the team. Keep your options.",
    summary:
      "Explore rental and Device-as-a-Service around your team's needs. Confirm the configuration, term and availability against your requirement.",
    workflowChain: "",
    capabilities: [
      "Zero upfront capital investment",
      "Flexible 1 to 36 month subscription terms",
      "Pre-configured delivery directly to employees",
    ],
    ctaLabel: "Explore device rental",
    ctaHref: "/laptop-desktop-rental",
    portalType: "client",
    visualBadge: "Client Portal · Fleet Subscriptions",
    visualTitle: "Active Hardware Allocations",
    visualSubtitle: "Employee assignments, subscription terms, and device health in view",
    metrics: [
      ["120", "Active Devices"],
      ["108", "Assigned to Team"],
      ["12", "Available Stock"],
    ],
    records: [
      {
        id: "TY-024",
        title: "ThinkPad T14 Gen 4 · 16 GB",
        detail: "Sample Employee A (Engineering, Bangalore)",
        status: "Assigned",
        statusType: "assigned",
      },
      {
        id: "TY-025",
        title: "MacBook Pro 16\" M3 · 32 GB",
        detail: "Sample Employee B (Design, Mumbai)",
        status: "Assigned",
        statusType: "assigned",
      },
      {
        id: "TY-026",
        title: "Dell Precision 3660 Workstation",
        detail: "Deployment reserve for upcoming intake",
        status: "Available",
        statusType: "available",
      },
    ],
    architecturalNote: "Client Portal: Central visibility into active allocations, warranty status, and subscription schedules.",
  },
  {
    id: "procure",
    number: "02",
    label: "Procure",
    tagline: "Source fleet hardware through a verified supplier network.",
    summary:
      "A single brief returns matched supplier options and transparent commercial comparisons.",
    workflowChain: "",
    capabilities: [
      "Single requirement brief for entire device fleets",
      "Multi-supplier commercial and availability matching",
      "End-to-end order orchestration from PO to dispatch",
    ],
    ctaLabel: "Explore IT Procurement",
    ctaHref: "/it-device-procurement",
    portalType: "central",
    visualBadge: "TriYantra Central CRM · Orchestration Hub",
    visualTitle: "Requirement & Sourcing Pipeline",
    visualSubtitle: "Centralized coordination connecting customer needs with verified supplier inventory",
    metrics: [
      ["18", "Active Requirements"],
      ["₹18.4L", "Sample Sourced Pipeline"],
      ["100%", "Supplier Vetting"],
    ],
    records: [
      {
        id: "RQ-024",
        title: "25 Business Laptops · Engineering Intake",
        detail: "Matched across 2 verified supplier options",
        status: "Matching",
        statusType: "matching",
      },
      {
        id: "QT-024",
        title: "Commercial Quote · Dual Configuration",
        detail: "Consolidated commercial terms submitted for client approval",
        status: "In Review",
        statusType: "review",
      },
      {
        id: "PO-024",
        title: "Fulfillment Order · Batch Configuration",
        detail: "Supplier reservation confirmed, imaging & dispatch coordinated",
        status: "Preparing",
        statusType: "pending",
      },
    ],
    architecturalNote: "Central CRM: Orchestrates multi-supplier sourcing into one clear commercial contract.",
  },
  {
    id: "manage",
    number: "03",
    label: "Manage",
    tagline: "Maintain total visibility over deployed workplace assets.",
    summary:
      "One live register tracking device health, user allocations, tickets, and renewals.",
    workflowChain: "",
    capabilities: [
      "Connected asset mapping from intake to return",
      "Built-in support ticket and peripheral replacement tracking",
      "Automated advance alerts for lease and warranty renewals",
    ],
    ctaLabel: "Explore Platform",
    ctaHref: "/platform",
    portalType: "client",
    visualBadge: "Client Portal · Lifecycle & Asset Control",
    visualTitle: "Fleet Lifecycle Operations",
    visualSubtitle: "Complete continuity across support requests, term reviews, and device returns",
    metrics: [
      ["120", "Tracked Assets"],
      ["3", "Renewals Due"],
      ["0", "Unresolved Incidents"],
    ],
    records: [
      {
        id: "TY-026",
        title: "Workstation Fleet · Term Review",
        detail: "12-month subscription completing; renew, upgrade, or return",
        status: "Renewal Due",
        statusType: "review",
      },
      {
        id: "TK-012",
        title: "Peripheral Swapping · Keyboard Unit",
        detail: "Replacement unit dispatched to Bangalore branch",
        status: "In Transit",
        statusType: "pending",
      },
      {
        id: "RT-024",
        title: "Offboarding Hardware Return",
        detail: "5 units scheduled for diagnostic condition check & wipe",
        status: "Return Scheduled",
        statusType: "review",
      },
    ],
    architecturalNote: "Lifecycle Operations: Every device lifecycle phase stays visible to HR, IT, and Finance.",
  },
] as const;
