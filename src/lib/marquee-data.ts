export interface VerifiedLogoItem {
  readonly name: string;
  readonly logoSrc: string;
  readonly alt: string;
  readonly width?: number;
  readonly height?: number;
}

// Honesty gate — see AGENTS.md "verification" + handoff §28.
// This rail is a true capability statement:
//   "software and platform ecosystems these fleets are PROVISIONED TO RUN",
// placed beside products we actually build & manage.
//
// It is deliberately NOT an endorsement claim:
//   - We do not claim any vendor sponsors, endorses, or certified TriYantra.
//   - Marks are real, correctly-attributed brand vectors (simple-icons/MIT),
//     self-hosted at /public/brands/*.svg so the rail works offline & in CI.
//   - The nearby marquee-note states the honest framing on the page itself.
export const verifiedLogos: readonly VerifiedLogoItem[] = [
  { name: "Microsoft 365", logoSrc: "/brands/microsoft.svg", alt: "Microsoft 365 – workplace suite these fleets are provisioned to run", width: 120, height: 36 },
  { name: "Google Workspace", logoSrc: "/brands/googlecloud.svg", alt: "Google Workspace – collaboration suite these fleets are provisioned to run", width: 118, height: 36 },
  { name: "VMware", logoSrc: "/brands/vmware.svg", alt: "VMware – virtualisation platform these fleets are provisioned to run", width: 114, height: 36 },
  { name: "Docker", logoSrc: "/brands/docker.svg", alt: "Docker – container platform these fleets are provisioned to run", width: 114, height: 36 },
  { name: "Kubernetes", logoSrc: "/brands/kubernetes.svg", alt: "Kubernetes – orchestration platform these fleets are provisioned to run", width: 116, height: 36 },
  { name: "Ubuntu", logoSrc: "/brands/ubuntu.svg", alt: "Ubuntu – Linux distribution these fleets are provisioned to run", width: 108, height: 36 },
  { name: "Red Hat", logoSrc: "/brands/redhat.svg", alt: "Red Hat Enterprise Linux – enterprise Linux these fleets are provisioned to run", width: 116, height: 36 },
  { name: "SAP", logoSrc: "/brands/sap.svg", alt: "SAP – ERP platform these fleets are provisioned to run", width: 104, height: 36 },
  { name: "Oracle", logoSrc: "/brands/oracle.svg", alt: "Oracle – database platform these fleets are provisioned to run", width: 110, height: 36 },
  { name: "Salesforce", logoSrc: "/brands/salesforce.svg", alt: "Salesforce – CRM platform these fleets are provisioned to run", width: 122, height: 36 },
  { name: "ServiceNow", logoSrc: "/brands/servicenow.svg", alt: "ServiceNow – IT service platform these fleets are provisioned to run", width: 126, height: 36 },
  { name: "Cisco", logoSrc: "/brands/cisco.svg", alt: "Cisco – networking platform these fleets are provisioned to run", width: 112, height: 36 },
  { name: "Dell", logoSrc: "/brands/dell.svg", alt: "Dell – device platform family these fleets include", width: 102, height: 36 },
  { name: "HP", logoSrc: "/brands/hp.svg", alt: "HP – device platform family these fleets include", width: 96, height: 36 },
  { name: "Lenovo", logoSrc: "/brands/lenovo.svg", alt: "Lenovo – device platform family these fleets include", width: 110, height: 36 },
  { name: "IBM", logoSrc: "/brands/ibm.svg", alt: "IBM – enterprise platform these fleets are provisioned to run", width: 110, height: 36 },
];
