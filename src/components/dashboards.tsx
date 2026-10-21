"use client";
import { useRef, useState } from "react";
import { Logo } from "./shared";
import { PortalStateMotion } from "./ui-motion";
import { AnimatedArrow } from "./animated-arrow";
const portals = [
  {
    id: "client",
    title: "01 Client Portal",
    label: "YOUR WORKPLACE",
    intro: "Your people. Your devices.",
    tabs: ["Devices", "Employees", "Renewals", "Tickets"],
    metrics: [
      ["120", "Devices"],
      ["108", "Assigned"],
    ],
    rows: {
      Devices: [
        ["TY-024 · Business laptop", "Assigned"],
        ["TY-025 · Performance laptop", "Available"],
        ["TY-026 · Desktop", "Renewal due"],
      ],
      Employees: [
        ["Sample employee A · TY-024", "Assigned"],
        ["Sample employee B · TY-026", "Assigned"],
        ["New starter · device pending", "Pending"],
      ],
      Renewals: [
        ["TY-026 · Review subscription", "Review"],
        ["TY-041 · Confirm next term", "Pending"],
        ["TY-052 · Return decision", "Review"],
      ],
      Tickets: [
        ["TK-012 · Keyboard issue", "Open"],
        ["TK-013 · Setup request", "In review"],
        ["TK-014 · Return pickup", "Pending"],
      ],
    },
    action: "Request a device",
    foot: "Assignments, renewals and service. In one view.",
  },
  {
    id: "central",
    title: "02 TriYantra Central CRM",
    label: "THE CENTRAL CONNECTING LAYER",
    intro: "Every requirement, orchestrated.",
    tabs: [
      "Requirements",
      "Matching",
      "Quotes",
      "Fulfilment",
      "Client health",
      "Pipeline",
    ],
    metrics: [
      ["18", "Requirements"],
      ["₹18.4L", "Sample pipeline"],
    ],
    rows: {
      Requirements: [
        ["RQ-024 · New team onboarding", "Matching"],
        ["RQ-025 · Device renewal", "Review"],
        ["RQ-026 · Workstation request", "Quoted"],
      ],
      Matching: [
        ["RQ-024 · Supplier option A", "Available"],
        ["RQ-024 · Supplier option B", "In review"],
        ["RQ-026 · Configuration review", "Matching"],
      ],
      Quotes: [
        ["QT-024 · Commercial comparison", "Review"],
        ["QT-025 · Approval requested", "Pending"],
        ["QT-026 · Scope clarification", "Draft"],
      ],
      Fulfilment: [
        ["PO-024 · Devices reserved", "Reserved"],
        ["PO-025 · Configuration check", "Preparing"],
        ["PO-026 · Dispatch coordination", "Pending"],
      ],
      "Client health": [
        ["Sample client A · Open ticket", "Review"],
        ["Sample client B · Renewal review", "Pending"],
        ["Sample client C · Onboarding", "In progress"],
      ],
      Pipeline: [
        ["Requirement · Sample total ₹8.4L", "Open"],
        ["Quoted · Sample total ₹6L", "Review"],
        ["Approval · Sample total ₹4L", "Pending"],
      ],
    },
    action: "Inspect requirement",
    foot: "Requirements → supplier matching → fulfilment",
  },
  {
    id: "supplier",
    title: "03 Supplier Portal",
    label: "SUPPLIER OPERATIONS",
    intro: "Availability meets opportunity.",
    tabs: ["Inventory", "Requests", "Reservations", "Dispatches", "Returns"],
    metrics: [
      ["286", "Available"],
      ["74", "Reserved"],
    ],
    rows: {
      Inventory: [
        ["Business laptop · 16 GB", "Available"],
        ["Performance laptop · 32 GB", "Reserved"],
        ["Desktop · 16 GB", "Available"],
      ],
      Requests: [
        ["RQ-024 · Business laptops", "Respond"],
        ["RQ-025 · Renewal requirement", "Review"],
        ["RQ-026 · Workstation configuration", "Respond"],
      ],
      Reservations: [
        ["RS-024 · Business laptops", "Reserved"],
        ["RS-025 · Performance laptops", "Preparing"],
        ["RS-026 · Desktop devices", "Pending"],
      ],
      Dispatches: [
        ["DS-024 · Configuration check", "Preparing"],
        ["DS-025 · Dispatch coordination", "Pending"],
        ["DS-026 · Device handover", "Review"],
      ],
      Returns: [
        ["RT-024 · Condition review", "Pending"],
        ["RT-025 · Accessories check", "Review"],
        ["RT-026 · Inventory update", "In progress"],
      ],
    },
    action: "Review request",
    foot: "Inventory, requests and device movement. Connected.",
  },
] as const;
function Portal({
  portal,
  scenario,
}: {
  portal: (typeof portals)[number];
  scenario: number;
}) {
  const [tab, setTab] = useState<string>(portal.tabs[0]);
  const [detail, setDetail] = useState<string | null>(null);
  const rows = (
    portal.rows as unknown as Record<string, readonly (readonly string[])[]>
  )[tab];
  return (
    <article
      className={"portal " + portal.id}
      id={portal.id}
      aria-label={portal.title}
    >
      <div className="portal-label">
        <span className="status-dot" />
        {portal.label}
      </div>
      <div className="portal-window">
        <div className="portal-top">
          <Logo small />
          <span className="sample-tag">Sample workspace</span>
        </div>
        <div className="portal-body">
          <p className="portal-kicker">{portal.intro}</p>
          <h3>{portal.title}</h3>
          <div className="metrics">
            {portal.metrics.map(([n, l]) => (
              <div key={l}>
                <span>{l}</span>
                <strong>{n}</strong>
                <small>Illustrative · no live comparison</small>
              </div>
            ))}
          </div>
          <div className="portal-tabs" aria-label={portal.title + " modules"}>
            {portal.tabs.map((t) => (
              <button
                key={t}
                data-rgb
                aria-pressed={tab === t}
                onClick={() => {
                  setTab(t);
                  setDetail(null);
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {portal.id !== "central" && (
            <p className="flow-context" aria-live="polite">
              {portal.id === "client"
                ? [
                    "Onboarding: 12 device assignments to plan",
                    "Renewal: 8 employee devices to review",
                    "Returns: 4 project devices to hand back",
                  ][scenario]
                : [
                    "Onboarding: check 12 available laptops",
                    "Renewal: review 8 device subscriptions",
                    "Returns: plan 4 incoming device checks",
                  ][scenario]}
            </p>
          )}
          <div className="portal-records" aria-live="polite">
            <div className="table-heading">
              <strong>{tab}</strong>
              <span>Sample data</span>
            </div>
            {rows.map(([label, status]) => (
              <button
                className="record"
                key={label}
                onClick={() => setDetail(label)}
              >
                <span>{label}</span>
                <span
                  className={
                    "badge " +
                    (["Pending", "Review", "Renewal due", "Open"].includes(
                      status,
                    )
                      ? "amber"
                      : "")
                  }
                >
                  {status}
                </span>
              </button>
            ))}
          </div>
          {portal.id === "central" && (
            <div className="orchestration">
              <span>CONNECTED REQUIREMENT · RQ-024</span>
              <strong>
                {
                  [
                    "12 laptops for a new team",
                    "Renew 8 employee devices",
                    "Return 4 project devices",
                  ][scenario]
                }
              </strong>
              <div className="pipeline-track">
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                {
                  [
                    "Requirement received → matching supplier availability",
                    "Renewal review → compare next-term options",
                    "Return request → coordinate supplier review",
                  ][scenario]
                }
              </p>
            </div>
          )}
          <button
            className="portal-action"
            data-rgb
            onClick={() =>
              setDetail(
                portal.id === "client"
                  ? "New device requirement"
                  : portal.id === "central"
                    ? "RQ-024 · Connected requirement"
                    : "RQ-024 · Supplier response",
              )
            }
          >
            {portal.action}
            <AnimatedArrow direction="up-right" size="sm" />
          </button>
          {detail && (
            <div className="sample-detail" role="status">
              <button
                aria-label={"Close " + portal.title + " detail"}
                onClick={() => setDetail(null)}
              >
                ×
              </button>
              <strong>{detail}</strong>
              <p>
                Concept interaction only. In the proposed workflow, this record
                connects the device, requirement and responsible team. No real
                request has been sent.
              </p>
            </div>
          )}
        </div>
      </div>
      <p className="portal-caption">{portal.foot}</p>
    </article>
  );
}
export function DashboardShowcase() {
  const [portalId, setPortalId] = useState("central");
  const root = useRef<HTMLDivElement>(null);
  const active = portals.find((p) => p.id === portalId) ?? portals[1];
  const onPortalKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const targetId = target?.id?.replace("portal-tab-", "");
    const currentIdx = portals.findIndex((p) => p.id === targetId);
    const idx = currentIdx !== -1 ? currentIdx : portals.findIndex((p) => p.id === active.id);
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (idx + 1) % portals.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (idx - 1 + portals.length) % portals.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = portals.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextId = portals[next].id;
    setPortalId(nextId);
    requestAnimationFrame(() => {
      document.getElementById("portal-tab-" + nextId)?.focus();
    });
  };
  return (
    <div className="showcase" ref={root}>
      <h2 className="sr-only">Three connected portal views</h2>
      <div className="showcase-toolbar">
        <p>
          <span className="status-dot" />
          Three views. One connected ecosystem.
        </p>
        <PortalStateMotion scenario={0} />
      </div>
      <div
        className="connection-story portal-pill-tablist"
        role="tablist"
        aria-label="3-Portal Architecture: Client Portal, Central CRM, and Supplier Portal"
        onKeyDown={onPortalKey}
      >
        <button
          type="button"
          id="portal-tab-client"
          role="tab"
          aria-selected={portalId === "client"}
          aria-controls="portal-panel-client"
          tabIndex={portalId === "client" ? 0 : -1}
          className={`portal-pill-btn connection-step ${portalId === "client" ? "is-selected" : ""}`}
          onClick={() => setPortalId("client")}
          data-rgb
        >
          <span>01 Client Portal</span>
        </button>
        <button
          type="button"
          id="portal-tab-central"
          role="tab"
          aria-selected={portalId === "central"}
          aria-controls="portal-panel-central"
          tabIndex={portalId === "central" ? 0 : -1}
          className={`portal-pill-btn connection-step is-dominant ${portalId === "central" ? "is-selected" : ""}`}
          onClick={() => setPortalId("central")}
          data-rgb
        >
          <span>02 TriYantra Central CRM</span>
        </button>
        <button
          type="button"
          id="portal-tab-supplier"
          role="tab"
          aria-selected={portalId === "supplier"}
          aria-controls="portal-panel-supplier"
          tabIndex={portalId === "supplier" ? 0 : -1}
          className={`portal-pill-btn connection-step ${portalId === "supplier" ? "is-selected" : ""}`}
          onClick={() => setPortalId("supplier")}
          data-rgb
        >
          <span>03 Supplier Portal</span>
        </button>
      </div>
      <div
        id={"portal-panel-" + active.id}
        role="tabpanel"
        aria-labelledby={"portal-tab-" + active.id}
        tabIndex={0}
        className={`portal-panel ${active.id === "central" ? "is-dominant-panel" : ""}`}
      >
        <Portal key={active.id} portal={active} scenario={0} />
      </div>
      <p className="concept-note">
        Interactive concept · All data is illustrative. TriYantra Central CRM
        coordinates verified suppliers with enterprise client requirements.
      </p>
    </div>
  );
}
