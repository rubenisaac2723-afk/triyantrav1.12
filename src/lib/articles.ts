export type Article = {
  slug: string;
  title: string;
  category: string;
  service: string;
  answer: string;
  sections: [string, string][];
  checklist: string[];
  faq: [string, string];
};
export const articles: Article[] = [
  {
    slug: "how-to-procure-laptops-for-a-growing-company",
    title: "How to Procure Laptops for a Growing Company",
    category: "Procurement",
    service: "it-device-procurement",
    answer:
      "Start with roles and applications, group users into a small number of device profiles, then compare complete supplier proposals against the same requirement.",
    sections: [
      [
        "Define the work before the device",
        "List the applications, operating system, connectivity and mobility each role needs. Separate essential requirements from preferences so comparable devices can be considered.",
      ],
      [
        "Make quotations comparable",
        "Ask each option to identify the configuration, quantity, availability, accessories, commercial terms and service scope. A model name alone is not a complete specification.",
      ],
      [
        "Plan the handover",
        "Confirm who approves the order, who receives the devices and who records each employee assignment. Keep procurement records connected to the asset inventory.",
      ],
    ],
    checklist: [
      "Role-based device profiles",
      "Hiring quantities and locations",
      "Approval owner and timeline",
      "Warranty and support scope to confirm",
    ],
    faq: [
      "Should every employee receive the same laptop?",
      "Use a small set of role-based profiles. Standardization helps administration, but specialist workloads may need different configurations.",
    ],
  },
  {
    slug: "corporate-laptop-procurement-checklist",
    title: "Corporate Laptop Procurement Checklist",
    category: "Procurement",
    service: "it-device-procurement",
    answer:
      "A useful procurement checklist covers the workload, device specification, commercial scope, delivery plan and asset handover, not just the laptop price.",
    sections: [
      [
        "Capture a complete requirement",
        "Record the user group, required applications, operating system, memory and storage needs, peripherals and deployment locations. Identify any compatibility requirements with existing tools.",
      ],
      [
        "Review the proposal",
        "Check configuration details, quantities, availability, taxes where applicable, payment terms and the exact warranty or support scope. Request clarification where a term is ambiguous.",
      ],
      [
        "Close the information gap",
        "Keep approved quotations and device records accessible to the responsible team. Record serial numbers and assignments at handover, then schedule the relevant lifecycle review.",
      ],
    ],
    checklist: [
      "Workload and configuration approved",
      "Complete commercial proposal reviewed",
      "Receiving and allocation owners assigned",
      "Device records and documents linked",
    ],
    faq: [
      "When should asset tracking start?",
      "Start when devices are received and verified. Record allocation before handover so ownership is clear from the first day of use.",
    ],
  },
  {
    slug: "it-procurement-vs-it-resellers",
    title: "IT Procurement vs IT Resellers",
    category: "Procurement",
    service: "it-device-procurement",
    answer:
      "IT procurement is the business process of defining, evaluating and acquiring technology. A reseller is a supplier channel that may form part of that process.",
    sections: [
      [
        "Separate the process from the channel",
        "Procurement includes requirements, approvals, commercial comparisons and handover. A reseller supplies products or services under its own commercial arrangement. The terms describe different things.",
      ],
      [
        "Evaluate responsibilities",
        "Ask who coordinates alternatives, checks specifications, manages fulfilment and maintains device records. Compare the responsibilities included in each proposal rather than relying on a category label.",
      ],
      [
        "Where TriYantra fits",
        "TriYantra uses a supplier-powered model to connect device requirements, sourcing and lifecycle workflows. The central software layer is intended to keep those responsibilities connected.",
      ],
    ],
    checklist: [
      "Sourcing responsibilities",
      "Commercial comparison process",
      "Fulfilment ownership",
      "Lifecycle handover",
    ],
    faq: [
      "Does working with a procurement partner remove the need for approvals?",
      "No. Your business still needs an approval process for requirements, commercial terms and final acceptance.",
    ],
  },
  {
    slug: "laptop-rental-vs-buying-for-business",
    title: "Laptop Rental vs Buying for Business",
    category: "Rental",
    service: "laptop-desktop-rental",
    answer:
      "Compare rental and buying over a set usage period. Evaluate support, administration, fleet changes, and end-of-term conditions alongside hardware costs.",
    sections: [
      [
        "Start with duration and certainty",
        "Consider how long the devices are needed and how certain the headcount is. A fixed project and a stable long-term role may lead to different commercial choices.",
      ],
      [
        "Compare the full scope",
        "Identify which services and accessories each option includes. Check replacement arrangements, damage conditions and return obligations directly in the proposal.",
      ],
      [
        "Decide using your business context",
        "Upfront purchase and recurring rental affect planning differently. Review the complete options with the people responsible for the budget and device lifecycle; neither option is universally cheaper.",
      ],
    ],
    checklist: [
      "Expected use period",
      "Like-for-like device specification",
      "Included support and accessories",
      "Return or disposal responsibilities",
    ],
    faq: [
      "Is rental always cheaper than buying?",
      "No. The comparison depends on duration, device specification, included services and contractual conditions. Use actual quotations over a common time period.",
    ],
  },
  {
    slug: "corporate-laptop-rental-guide",
    title: "Corporate Laptop Rental Guide",
    category: "Rental",
    service: "laptop-desktop-rental",
    answer:
      "Prepare a rental requirement around the users, configurations, duration and locations. Confirm the full commercial and service terms before deployment.",
    sections: [
      [
        "Specify what employees need",
        "List the roles, applications, quantities and peripherals. If hiring dates differ, describe the planned deployment sequence instead of giving only one total number.",
      ],
      [
        "Clarify the rental scope",
        "Ask about availability, rental duration, support, replacement process and conditions for changes or returns. Treat the approved quotation and agreement as the source for inclusions.",
      ],
      [
        "Manage the rental lifecycle",
        "Track device assignments, documents and renewal dates. Plan who reviews changes before the current term ends and who coordinates the physical return where needed.",
      ],
    ],
    checklist: [
      "Configuration and quantity",
      "Duration and locations",
      "Service and replacement scope",
      "Renewal and return process",
    ],
    faq: [
      "Can the rental fleet change over time?",
      "Discuss expected changes in the requirement. Additions, reductions and renewals depend on the agreed terms and device availability.",
    ],
  },
  {
    slug: "laptop-rental-for-startups",
    title: "Laptop Rental for Startups",
    category: "Rental",
    service: "laptop-desktop-rental",
    answer:
      "Laptop rental gives startups device access through predictable recurring terms. Compare flexibility, total costs and contract terms against hiring plans.",
    sections: [
      [
        "Keep the first requirement focused",
        "Start with confirmed roles, applications and joining dates. Describe likely future additions separately so they can be discussed without treating them as an immediate order.",
      ],
      [
        "Inspect the flexibility",
        "A recurring arrangement does not automatically mean you can change or exit at any time. Review minimum duration, notice requirements and device return conditions.",
      ],
      [
        "Keep control of assignments",
        "Even a small team benefits from a device register. Record the assigned employee, serial number, accessories and planned lifecycle review date.",
      ],
    ],
    checklist: [
      "Confirmed hires and joining dates",
      "Minimum device profiles",
      "Duration and change conditions",
      "Employee assignment owner",
    ],
    faq: [
      "How many devices should a startup request?",
      "Base the request on confirmed needs and explain expected growth separately. TriYantra can discuss the requirement without the website assuming a minimum order.",
    ],
  },
  {
    slug: "what-is-device-as-a-service",
    title: "What is Device-as-a-Service?",
    category: "DaaS",
    service: "device-as-a-service",
    answer:
      "Device-as-a-Service is a commercial approach that combines access to workplace devices with an agreed service and lifecycle scope through a subscription model.",
    sections: [
      [
        "Look beyond the hardware",
        "A DaaS conversation includes deployment, support, device records and lifecycle decisions. The exact combination of services depends on the provider and the agreed proposal.",
      ],
      [
        "Understand the subscription",
        "Review term length, included services, change conditions and what happens at renewal or return. Do not assume that every service is included simply because an offering is called DaaS.",
      ],
      [
        "Connect people and devices",
        "TriYantra’s approach brings supplier-powered sourcing and device management into one intended connected workflow, with client, central and supplier perspectives.",
      ],
    ],
    checklist: [
      "Device configuration",
      "Included lifecycle services",
      "Subscription and change terms",
      "Renewal or return conditions",
    ],
    faq: [
      "Is DaaS just laptop rental?",
      "DaaS describes a broader intended device-and-service lifecycle model. Compare the actual included scope; labels alone do not establish what you receive.",
    ],
  },
  {
    slug: "daas-vs-traditional-procurement",
    title: "DaaS vs Traditional Procurement",
    category: "DaaS",
    service: "device-as-a-service",
    answer:
      "Traditional procurement buys devices upfront; DaaS provides a recurring subscription with lifecycle support. Compare team responsibilities and costs.",
    sections: [
      [
        "Map ownership of the work",
        "List who handles sourcing, deployment, support, asset records and end-of-life decisions in each option. This reveals which work stays with your internal team.",
      ],
      [
        "Use a common comparison period",
        "Compare the same device profiles, quantities and duration. Include the internal effort and external services needed to make the options comparable.",
      ],
      [
        "Review the exit as carefully as the start",
        "Clarify renewal, return and replacement conditions. For purchases, consider the responsibility for refresh and disposal; for DaaS, review the contractual end-of-term process.",
      ],
    ],
    checklist: [
      "Same devices and usage period",
      "Service responsibilities mapped",
      "Internal administration effort",
      "End-of-term process",
    ],
    faq: [
      "Which model gives more control?",
      "Control depends on the agreed terms and your operating processes. Compare device choices, visibility and change rights explicitly.",
    ],
  },
  {
    slug: "benefits-of-daas-for-startups",
    title: "Benefits of DaaS for Startups",
    category: "DaaS",
    service: "device-as-a-service",
    answer:
      "DaaS helps startups plan hardware access and lifecycle maintenance together. Evaluate subscription terms, hiring pace, and commercial conditions.",
    sections: [
      [
        "Bring the requirement together",
        "Discuss devices, deployment and ongoing service in one plan. This can make responsibility clearer than arranging each element without a shared handover.",
      ],
      [
        "Plan around a growing team",
        "Describe confirmed hires and likely changes. Ask how additions, role changes and returns would be handled under the proposed arrangement.",
      ],
      [
        "Check the tradeoffs",
        "Recurring commitments need the same scrutiny as purchases. Review duration, included services and change conditions before deciding whether the model fits.",
      ],
    ],
    checklist: [
      "Hiring pattern",
      "Service scope",
      "Recurring commitment",
      "Change and return conditions",
    ],
    faq: [
      "Does DaaS eliminate internal IT work?",
      "No. Your team still owns decisions such as application access, employee processes and internal policies. Confirm the boundaries of any device service.",
    ],
  },
  {
    slug: "what-is-it-asset-management",
    title: "What is IT Asset Management?",
    category: "Asset management",
    service: "platform",
    answer:
      "IT asset management keeps a reliable record of technology assets, who uses them, where they are and how they move through their lifecycle.",
    sections: [
      [
        "Build a useful asset record",
        "Record device identity, configuration, location, assigned employee and ownership or subscription context. Link relevant commercial documents without duplicating sensitive information unnecessarily.",
      ],
      [
        "Record changes as they happen",
        "Onboarding, reassignment, repairs and returns all change the device record. Define a responsible owner and a repeatable handover process.",
      ],
      [
        "Use the record to plan",
        "Review renewals, unassigned devices and open service requests. The value comes from reliable updates and clear responsibility, not simply having a large spreadsheet.",
      ],
    ],
    checklist: [
      "Unique device identity",
      "Employee and location",
      "Commercial and lifecycle context",
      "Update owner",
    ],
    faq: [
      "Is an inventory list enough?",
      "An inventory is a starting point. Asset management also includes assignments, changes, service activity and lifecycle decisions.",
    ],
  },
  {
    slug: "how-to-track-employee-laptops",
    title: "How to Track Employee Laptops",
    category: "Asset management",
    service: "platform",
    answer:
      "Use a unique device record, link it to the employee assignment and location, and update the record at every handover, repair and return.",
    sections: [
      [
        "Create the device record",
        "Capture a stable asset ID and manufacturer serial number, alongside the model and configuration. Avoid using the employee name as the device identifier because assignments change.",
      ],
      [
        "Make the handover explicit",
        "Record the employee, location, assignment date and accessories. Make the responsible team part of the process so changes are not left in a private message thread.",
      ],
      [
        "Keep lifecycle events connected",
        "Update the assignment when a device is returned, replaced or reassigned. Device allocation tracking is distinct from monitoring employee activity; collect only information needed for asset administration.",
      ],
    ],
    checklist: [
      "Asset ID and serial number",
      "Assignment and handover date",
      "Accessories and location",
      "Return or replacement record",
    ],
    faq: [
      "Does asset tracking mean monitoring employees?",
      "No. This guide concerns device inventory and assignment records, not employee activity monitoring.",
    ],
  },
  {
    slug: "device-allocation-best-practices",
    title: "Device Allocation Best Practices",
    category: "Asset management",
    service: "platform",
    answer:
      "Allocate devices using role-based requirements, a clear handover record and a repeatable process for changes and returns.",
    sections: [
      [
        "Match the role",
        "Use the employee’s required applications and work context to select a device profile. Record exceptions so the next procurement request can learn from them.",
      ],
      [
        "Check before the handover",
        "Confirm the device identity, accessories and receiving employee. Coordinate setup with the responsible IT team and make the assignment record part of the handover.",
      ],
      [
        "Close the loop",
        "When an employee changes role or leaves, review the assignment, collect accessories where applicable and record the next device status. Keep the return and reassignment process clear.",
      ],
    ],
    checklist: [
      "Approved role profile",
      "Device and accessories verified",
      "Assignment recorded",
      "Return workflow assigned",
    ],
    faq: [
      "Who should own the assignment record?",
      "Choose a clear operational owner, typically in IT or operations, with HR supplying relevant joining and leaving information.",
    ],
  },
  {
    slug: "laptop-rental-vs-purchase",
    title: "Laptop Rental vs Purchase",
    category: "Decision guides",
    service: "laptop-desktop-rental",
    answer:
      "Choose between rental and purchase by comparing expected duration, cash commitments, service scope and lifecycle responsibilities using real proposals.",
    sections: [
      [
        "Create a like-for-like comparison",
        "Use the same specification, quantities and time period for each option. A lower quoted amount can hide different configurations or service inclusions.",
      ],
      [
        "List the operational differences",
        "Identify the work your team will own: deployment, support coordination, asset administration, replacement and end-of-term handling.",
      ],
      [
        "Document the reason for the choice",
        "Keep the assumptions with the approved option. A decision made for a short project may not be appropriate for a stable, long-term device fleet.",
      ],
    ],
    checklist: [
      "Comparable configuration",
      "Common time period",
      "Operational scope",
      "Documented assumptions",
    ],
    faq: [
      "Can a business use both rental and purchase?",
      "Yes, different requirements can be evaluated separately. Keep the records and responsibilities clear for each commercial model.",
    ],
  },
  {
    slug: "daas-vs-leasing",
    title: "DaaS vs Leasing",
    category: "Decision guides",
    service: "device-as-a-service",
    answer:
      "Compare DaaS and leasing by inspecting service and contract scope. DaaS includes ongoing lifecycle management; equipment lease terms vary by provider.",
    sections: [
      [
        "Inspect the included service",
        "Identify whether deployment, support, replacements and lifecycle records are included, optional or handled internally. Neither label establishes the answer on its own.",
      ],
      [
        "Review the commercial conditions",
        "Check duration, payment obligations, change conditions and end-of-term options in the written proposal. Ask the appropriate advisers about accounting or contractual treatment for your business.",
      ],
      [
        "Choose around your operating needs",
        "Map each responsibility to a team or provider, then compare the proposals against your required device lifecycle. TriYantra can discuss the DaaS requirement and intended workflow.",
      ],
    ],
    checklist: [
      "Included services",
      "Term and change conditions",
      "End-of-term options",
      "Responsibility for each lifecycle step",
    ],
    faq: [
      "Does DaaS always include device ownership?",
      "Do not assume ownership or transfer rights from the label. These must be established in the specific agreement.",
    ],
  },
  {
    slug: "how-to-calculate-tco-for-business-laptops",
    title: "How to Calculate TCO for Business Laptops",
    category: "Decision guides",
    service: "it-device-procurement",
    answer:
      "Calculate IT total cost of ownership by adding hardware or subscription costs, setup, support, and admin overhead, minus any verifiable residual value.",
    sections: [
      [
        "Set consistent assumptions",
        "Use a common time period, number of devices and configuration. Keep assumptions visible and use actual quotations where available.",
      ],
      [
        "Include the work around the device",
        "Count setup, accessories, support and administration only once. If a subscription already includes a service, avoid adding that cost again. Record uncertain costs as estimates.",
      ],
      [
        "Test the result",
        "Review how the comparison changes with device duration, support needs or headcount. A transparent estimate is more useful than a precise-looking number built on hidden assumptions.",
      ],
    ],
    checklist: [
      "Device / subscription amount in ₹",
      "Setup, accessories and support",
      "Internal administration estimate",
      "End-of-term costs and supportable residual value",
    ],
    faq: [
      "Should I include resale value?",
      "Include it only if you have a reasonable basis for the estimate and your arrangement gives you the relevant rights. Also compare a scenario with no residual value.",
    ],
  },
];
