export const services = [
  {
    slug: "laptop-desktop-rental",
    label: "Laptop & Desktop Rental",
    title: "Laptop & Desktop Rental for Businesses",
    intro:
      "Rent business laptops, desktops and displays on flexible terms. Avoid heavy upfront capital while ensuring full support and centralized asset tracking.",
    cta: "Get a Rental Quote",
    type: "Rent",
    word: "RENT",
    short: "Turn hardware investment into a predictable operating expense.",
    details: [
      [
        "Devices for the way you work",
        "Specify your applications, team size and role requirements. We match hardware directly to the tasks your employees perform.",
      ],
      [
        "A commercial model that fits",
        "Evaluate durations from 1 to 36 months with clear monthly costs. Pricing, maintenance and terms are confirmed upfront in your quote.",
      ],
      [
        "Visibility beyond deployment",
        "Track assignments, renewals, service tickets and returns within a single connected dashboard.",
      ],
    ],
    checklist: [
      "Device quantity and configuration",
      "Rental duration and expected start date",
      "Deployment locations",
      "Support, replacement and return requirements",
    ],
  },
  {
    slug: "it-device-procurement",
    label: "IT Device Procurement",
    title: "Business IT & Laptop Procurement Services",
    intro:
      "Source enterprise IT hardware through a single brief. TriYantra provides supplier matching, transparent commercial comparisons and coordinated delivery.",
    cta: "Tell Us Your Requirement",
    type: "Purchase",
    word: "PROCURE",
    short: "Find the right technology at the right cost.",
    details: [
      [
        "Start with a clear requirement",
        "Define user roles, configurations, quantities and locations once. We separate essential specifications from optional upgrades.",
      ],
      [
        "Compare the complete option",
        "Evaluate hardware specs, delivery timelines and bulk commercial terms together without managing multiple vendor negotiations.",
      ],
      [
        "Connect procurement to deployment",
        "Transition approved orders directly into device imaging, staged delivery and inventory records.",
      ],
    ],
    checklist: [
      "Required applications and operating system",
      "Minimum specifications and accessories",
      "Quantity, budget context and locations",
      "Approval process and deployment timeline",
    ],
  },
  {
    slug: "device-as-a-service",
    label: "Device-as-a-Service",
    title: "Device-as-a-Service for Businesses",
    intro:
      "Combine workplace hardware, pre-configuration, ongoing maintenance and regular refreshes into a predictable per-seat monthly subscription.",
    cta: "Explore Device-as-a-Service",
    type: "DaaS",
    word: "SUBSCRIBE",
    short: "Devices, deployment and lifecycle visibility. Connected.",
    details: [
      [
        "Plan around your workforce",
        "Map device configurations directly to employee roles, branch locations and upcoming hiring targets.",
      ],
      [
        "Bring the lifecycle together",
        "Bundle delivery, warranty coverage, peripheral replacements and IT support into a single predictable invoice.",
      ],
      [
        "Keep commercial decisions visible",
        "Upgrade, renew or return devices at the end of each term as your team's technical needs evolve.",
      ],
    ],
    checklist: [
      "Current workforce and hiring plans",
      "Device needs by role",
      "Subscription duration and commercial preferences",
      "Support and lifecycle expectations",
    ],
  },
] as const;
export const modules = [
  "Supplier Management",
  "Procurement",
  "Device Management",
  "Employee Management",
  "Asset Tracking",
  "Subscription Management",
  "Billing & Documents",
  "Lifecycle Management",
  "Reporting",
];
export const steps = [
  [
    "Tell us what you need.",
    "Specify device models, quantities, deployment locations and commercial preferences.",
  ],
  [
    "TriYantra coordinates sourcing.",
    "TriYantra matches your brief across verified suppliers for availability and pricing.",
  ],
  [
    "Compare and approve.",
    "Review side-by-side configurations, delivery timelines and commercial terms in one quote.",
  ],
  [
    "Deploy.",
    "Devices are imaged, tested and dispatched directly to branch offices or remote staff.",
  ],
  [
    "Manage.",
    "Track active assets, employee assignments, support requests and billing records in one view.",
  ],
  [
    "Scale, replace, renew or return.",
    "Easily upgrade hardware, extend agreements or coordinate returns as your team evolves.",
  ],
];
export const homeSteps = [
  "Tell us what you need",
  "We source the right option",
  "Approve and deploy",
  "Manage everything centrally",
  "Scale when your business changes",
];
export const deviceCategories = [
  "Business Laptops",
  "Performance Laptops",
  "MacBooks",
  "Desktops & Workstations",
  "Monitors & Accessories",
];
export const faqs = [
  [
    "What does TriYantra help businesses do?",
    "TriYantra helps businesses rent, procure and manage workplace devices through a supplier-powered operating model and a central software layer.",
  ],
  [
    "Can I discuss rental and purchase options together?",
    "Yes. Choose Not Sure in your requirement and describe the devices, quantities and timeline you are considering. The right commercial model depends on your needs.",
  ],
  [
    "Are the dashboards live product screenshots?",
    "No. The three portal views are interactive concepts with sample data. They illustrate the intended connected workflow and roadmap functionality, not current company performance or a commitment that every module is live.",
  ],
  [
    "How are pricing and availability confirmed?",
    "Pricing, availability, delivery arrangements and service scope are confirmed in a specific quotation. The website does not publish fixed prices or delivery guarantees.",
  ],
];
export const pageMeta: Record<string, [string, string]> = {
  "/": [
    "Workplace Technology & Device-as-a-Service | TriYantra",
    "Rent, procure and manage workplace devices with TriYantra. Connected IT procurement, Device-as-a-Service and asset management through one platform.",
  ],
  "/platform": [
    "Workplace Technology Platform | TriYantra",
    "Explore the connected Client Portal, TriYantra Central CRM and Supplier Portal concept for procurement, devices and lifecycle management.",
  ],
  "/how-it-works": [
    "How TriYantra Works | Requirement to Managed Device",
    "Follow the TriYantra workflow from your device requirement through sourcing, approval, deployment and lifecycle management.",
  ],
  "/about": [
    "About TriYantra | A Connected Technology Ecosystem",
    "Learn how TriYantra combines supplier-powered procurement, Device-as-a-Service and technology management for growing businesses.",
  ],
  "/resources": [
    "Workplace Technology Guides & Insights | TriYantra",
    "Practical guides to business laptop procurement, rental, Device-as-a-Service and employee asset management.",
  ],
  "/contact": [
    "Get a Workplace Device Quote | TriYantra",
    "Tell TriYantra your business device requirements, team size, locations and timeline to discuss procurement, rental or Device-as-a-Service.",
  ],
  "/privacy": [
    "Privacy Policy | TriYantra",
    "How TriYantra (Matrix DaaS Private Limited) collects, protects, and manages customer and corporate data.",
  ],
  "/terms": [
    "Terms & Conditions | TriYantra",
    "TriYantra terms and conditions governing enterprise hardware procurement, equipment rental agreements, Device-as-a-Service and client obligations.",
  ],
  "/refund-policy": [
    "Refund & Cancellation Policy | TriYantra",
    "TriYantra refund, return and cancellation policy for enterprise equipment rentals, Device-as-a-Service subscriptions and hardware procurements.",
  ],
  "/shipping-policy": [
    "Shipping & Delivery Policy | TriYantra",
    "TriYantra shipping and delivery policy for laptops, desktops, and enterprise IT hardware across India, covering dispatch timelines and transit insurance.",
  ],
  "/accessibility-statement": [
    "Accessibility Statement | TriYantra",
    "TriYantra accessibility statement outlining our commitment to digital accessibility, inclusive design and compliance with WCAG 2.2 AA standards.",
  ],
  "/compliance": [
    "Regulatory & Enterprise Compliance | TriYantra",
    "Enterprise compliance, statutory standards, vendor verification protocols and information security policies at TriYantra (Matrix DaaS Private Limited).",
  ],
};
for (const s of services)
  pageMeta["/" + s.slug] = [s.label + " for Businesses | TriYantra", s.intro];
