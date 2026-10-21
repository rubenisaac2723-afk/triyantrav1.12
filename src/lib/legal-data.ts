export interface LegalDocument {
  readonly slug:
    | "privacy"
    | "terms"
    | "refund-policy"
    | "shipping-policy"
    | "accessibility-statement"
    | "compliance";
  readonly title: string;
  readonly lastUpdated?: string;
  readonly summary: string;
  readonly sections: readonly {
    readonly heading: string;
    readonly content: string;
    readonly bulletPoints?: readonly string[];
    readonly note?: string;
  }[];
}

export const legalDocuments: Record<string, LegalDocument> = {
  "shipping-policy": {
    slug: "shipping-policy",
    title: "Shipping & Delivery Policy",
    summary:
      "At TriYantra, we ensure seamless and timely delivery of laptops, desktops, and IT devices to support your business operations without delays. Our logistics and deployment process is designed to provide fast, secure, and hassle-free delivery across India.",
    sections: [
      {
        heading: "1. Service Coverage & Locations",
        content:
          "TriYantra currently offers delivery and deployment services across major commercial hubs in India, including:",
        bulletPoints: [
          "Bangalore",
          "Hyderabad",
          "Chennai",
          "Mumbai",
          "Pune",
          "Delhi NCR",
          "Pan-India deployment supported for bulk and enterprise requirements through our verified partner network.",
        ],
        note: "Need delivery in a different location? Contact us at info@triyantra.com",
      },
      {
        heading: "2. Delivery Timelines",
        content:
          "We aim to deliver devices as quickly as possible based on your operational requirements:",
        bulletPoints: [
          "Standard Delivery: 2–5 business days",
          "Express Delivery: 24–48 hours (available in select metropolitan cities)",
          "Bulk Orders: 3–7 business days depending on volume and configuration requirements",
        ],
        note: "Delivery timelines may vary based on device availability, customization requirements, and location.",
      },
      {
        heading: "3. Order Processing",
        content:
          "Our structured fulfillment and deployment workflow ensures device reliability:",
        bulletPoints: [
          "Orders are processed within 24–48 hours after commercial confirmation.",
          "Device configuration, hardware diagnostic quality checks, and secure packaging are completed before dispatch.",
          "Clients receive formal confirmation and tracking details once the order is ready for delivery.",
        ],
      },
      {
        heading: "4. Installation & Deployment Support",
        content:
          "TriYantra provides comprehensive deployment support to ensure zero downtime for your team:",
        bulletPoints: [
          "Pre-configured devices (ready-to-use with specified OS and software image)",
          "On-site installation for bulk and corporate office orders",
          "Remote setup and onboarding assistance for individual team members",
        ],
      },
      {
        heading: "5. Shipping Charges",
        content:
          "We offer free delivery for most business orders within supported metropolitan areas. Additional charges may apply for:",
        bulletPoints: [
          "Remote delivery locations outside standard logistics routes",
          "Express delivery requests requiring dedicated courier transit",
          "Special on-site deployment or white-glove staging requirements",
        ],
        note: "All applicable charges will be transparently communicated before order confirmation.",
      },
      {
        heading: "6. Order Tracking & Dispatch Coordination",
        content:
          "Once your hardware order is dispatched from our fulfillment center:",
        bulletPoints: [
          "You will receive delivery updates and dispatch notices via email or phone.",
          "Our logistics desk coordinates directly with your designated site contact for delivery and installation scheduling.",
        ],
      },
      {
        heading: "7. Delivery Requirements",
        content:
          "To guarantee smooth and uninterrupted delivery, clients must ensure:",
        bulletPoints: [
          "An accurate, complete delivery address and point of contact are provided.",
          "An authorized representative is available at the delivery location to receive the shipment.",
          "For commercial office premises, security clearance and building access permissions are arranged in advance.",
        ],
      },
      {
        heading: "8. Delays & Unforeseen Circumstances",
        content:
          "While we strive for punctual delivery, transit delays may occasionally arise due to logistics disruptions, adverse weather conditions, high-demand peak periods, or location-specific security constraints. Our team will proactively inform you of any changes to your delivery schedule.",
      },
      {
        heading: "9. Damaged or Missing Items",
        content:
          "If you receive a shipment that exhibits transit damage or incomplete hardware items:",
        bulletPoints: [
          "Report the discrepancy within 24 hours of delivery receipt.",
          "Contact our support team immediately at info@triyantra.com or +91 91645 43111.",
          "Our operations desk will dispatch a priority replacement or missing components at the earliest.",
        ],
      },
      {
        heading: "10. Contact for Shipping Queries",
        content:
          "For any shipping, delivery, or logistics-related inquiries, reach out to our team:",
        bulletPoints: [
          "Email: info@triyantra.com",
          "Phone: +91 91645 43111",
          "Website: www.triyantra.com",
        ],
      },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    summary:
      "At TriYantra, we are committed to providing reliable and high-quality device rental services. This Refund & Cancellation Policy outlines the terms under which refunds, cancellations, and billing adjustments are handled.",
    sections: [
      {
        heading: "1. Cancellation Policy",
        content:
          "Orders can be cancelled before dispatch without any charges. Please review the following conditions:",
        bulletPoints: [
          "Orders cancelled prior to warehouse dispatch incur zero cancellation fees.",
          "Once hardware has been dispatched, cancellation requests may incur logistics and handling charges.",
          "For deployed hardware fleets, cancellation is subject to the agreed minimum rental period.",
        ],
        note: "To request a cancellation, contact us at info@triyantra.com",
      },
      {
        heading: "2. Refund Eligibility & Circumstances",
        content:
          "Refunds and billing adjustments are applicable strictly under the following circumstances:",
        bulletPoints: [
          "Device delivered is defective or not as per mutually agreed hardware specifications.",
          "Order is cancelled prior to dispatch from our facility.",
          "Duplicate or excess commercial payment has been received.",
        ],
      },
      {
        heading: "3. Non-Eligibility for Refunds",
        content:
          "Refunds are not applicable in the following circumstances:",
        bulletPoints: [
          "Change of mind after successful delivery and receipt of devices.",
          "Partial usage of an ongoing rental billing period.",
          "Violation of agreed device usage or rental agreement terms.",
        ],
      },
      {
        heading: "4. Rental Billing Policy & Minimum Commitment",
        content:
          "All rentals are subject to a minimum commitment period of 6 months. Standard billing parameters:",
        bulletPoints: [
          "Rental charges are billed on a monthly subscription basis unless otherwise agreed in writing.",
          "Once a billing cycle begins, charges for that cycle are non-refundable.",
          "Early termination of rental does not qualify for prorated refunds unless explicitly agreed in the Master Services Agreement.",
        ],
        note: "“All rentals are subject to a minimum commitment period of 6 months.”",
      },
      {
        heading: "5. Billing Disputes",
        content:
          "If you have concerns or discrepancies regarding invoicing or billing charges:",
        bulletPoints: [
          "Notify our billing department within 3 business days of invoice receipt.",
          "Our finance desk will review the documentation and resolve the discrepancy promptly.",
        ],
      },
      {
        heading: "6. Security Deposit Refunds",
        content:
          "Any refundable security deposit collected will be returned following device pickup and physical inspection. Deductions may apply for:",
        bulletPoints: [
          "Physical damage to hardware chassis, screens, or internal components.",
          "Missing accessories, chargers, power cables, or peripherals.",
          "Misuse beyond reasonable wear and tear.",
        ],
        note: "Refund processing timeline: 5–10 business days following successful inspection.",
      },
      {
        heading: "7. Non-Refundable Charges",
        content:
          "The following service and operational fees are strictly non-refundable once incurred:",
        bulletPoints: [
          "Delivery, freight, and return logistics charges.",
          "Installation and setup fees (where specialized on-site staging was performed).",
          "Third-party software licensing or provisioning fees.",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "At TriYantra, we value your privacy and are committed to protecting your personal and business information. This Privacy Policy outlines how we collect, use, store, and safeguard your data when you interact with our website and services.",
    sections: [
      {
        heading: "1. Information We Collect",
        content:
          "We collect the following categories of information to provide enterprise hardware solutions:",
        bulletPoints: [
          "Personal Information: Name, Email address, Phone number, Company name, Job title.",
          "Business Information: Device requirements, fleet specifications, order details, billing and payment information.",
          "Technical Information: IP address, browser type and version, device type, visited pages, and session duration on our platform.",
        ],
      },
      {
        heading: "2. How We Use Your Information",
        content:
          "We process collected information solely for legitimate enterprise operations:",
        bulletPoints: [
          "Provide, configure, and manage device rental and procurement services.",
          "Process commercial orders, invoices, and payments.",
          "Respond to requirement briefs, customer support, and technical assistance requests.",
          "Improve our platform functionality, user interface, and client service experience.",
          "Transmit essential order updates, operational notices, and service communications.",
        ],
      },
      {
        heading: "3. Data Sharing & Disclosure",
        content:
          "TriYantra does not sell your personal or corporate information. Data is shared exclusively with authorized service providers who maintain strict confidentiality:",
        bulletPoints: [
          "Trusted logistics and hardware delivery partners for order fulfillment.",
          "Secure payment processing providers for billing execution.",
          "Technical service and field support partners assisting with on-site deployment.",
          "Legal, statutory, or regulatory authorities where mandated by applicable Indian law.",
        ],
        note: "All operational partners are contractually obligated to maintain confidentiality and data security.",
      },
      {
        heading: "4. Data Storage & Security",
        content:
          "We implement industry-standard technical and organizational safeguards to protect your information against unauthorized access, alteration, or disclosure. All information is stored in secure environments with access strictly limited to authorized personnel.",
      },
      {
        heading: "5. Cookies & Tracking Technologies",
        content:
          "Our website may utilize essential cookies and analytical technologies to enhance browsing experience, measure site traffic, and optimize performance. You can disable non-essential cookies via your web browser settings at any time.",
      },
      {
        heading: "6. Your Rights & Access",
        content:
          "As a corporate client or website visitor, you maintain full rights regarding your data:",
        bulletPoints: [
          "Request access to the personal data we hold concerning your organization.",
          "Request correction or rectification of incomplete or inaccurate records.",
          "Request deletion of your information, subject to statutory retention obligations.",
          "Opt out of non-transactional marketing and communication updates.",
        ],
        note: "To exercise any data rights, contact us at info@triyantra.com",
      },
      {
        heading: "7. Third-Party Websites & Links",
        content:
          "Our website may contain links to external resources or technology partners. TriYantra is not responsible for the privacy practices, content, or compliance of third-party websites.",
      },
      {
        heading: "8. Data Retention Periods",
        content:
          "We retain corporate and personal records only for the duration necessary to satisfy ongoing service contracts, fulfill regulatory and tax audit mandates, and maintain business operational records.",
      },
      {
        heading: "9. Policy Updates",
        content:
          "TriYantra may revise this Privacy Policy periodically to reflect changes in our operational procedures or regulatory guidelines. Any modifications will be published directly on this page with an updated effective revision date.",
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    summary:
      "Welcome to TriYantra. These Terms & Conditions govern your use of our website and services, including device rentals, IT asset management, and related solutions. By engaging with TriYantra, you agree to comply with and be bound by these terms.",
    sections: [
      {
        heading: "1. Services Offered",
        content:
          "TriYantra provides business IT solutions including laptop and desktop rentals, IT asset lifecycle management, device deployment and support services, and custom enterprise hardware solutions. All services are subject to inventory availability and mutually agreed commercial contracts.",
      },
      {
        heading: "2. Eligibility to Use Services",
        content:
          "To engage TriYantra services or execute commercial contracts:",
        bulletPoints: [
          "You must be at least 18 years of age.",
          "You must represent a valid, registered business entity or commercial organization.",
          "You agree to provide true, accurate, and complete information during all onboarding and contracting steps.",
        ],
      },
      {
        heading: "3. Rental Agreement & Minimum Commitment",
        content:
          "All devices are provided on a rental or subscription basis. A minimum rental commitment period (e.g., 3, 6, or 12 months) applies as confirmed in writing at the time of order placement. Early termination prior to the completion of the commitment period may incur contractual adjustment charges to ensure operational continuity.",
      },
      {
        heading: "4. Pricing, Billing & Payments",
        content:
          "Rental charges are billed on a monthly subscription schedule unless otherwise stipulated in the Service Order. Invoices are payable within the agreed commercial credit term. Delayed payments may result in late interest fees, service suspension, or hardware retrieval.",
      },
      {
        heading: "5. Security Deposit Terms",
        content:
          "A refundable security deposit may be required based on credit evaluation and order volume. Deposit refunds are processed following hardware return, inspection, and verification. Deductions may be applied for damage or unreturned peripheral components.",
      },
      {
        heading: "6. Device Usage Policy (Acceptable Use)",
        content:
          "Clients agree to:",
        bulletPoints: [
          "Utilize hardware exclusively for lawful corporate and business purposes.",
          "Refrain from tampering with internal components, reselling, or subleasing devices to third parties.",
          "Maintain all equipment in clean, operational condition with reasonable care.",
        ],
        note: "Unauthorized usage or breach of these terms may result in immediate contract termination and device repossession.",
      },
      {
        heading: "7. Maintenance & Support",
        content:
          "TriYantra provides standard hardware maintenance, technical repair support, and expedited device replacement in the event of manufacturing defects or hardware malfunctions. Specific SLA response windows depend on the client's chosen service plan.",
      },
      {
        heading: "8. Damage, Loss & Liability for Devices",
        content:
          "Clients maintain custody and responsibility for hardware during the active rental term, including physical damage, theft, total loss, or negligence. Repair or full replacement costs for damage exceeding normal wear and tear will be billed to the client.",
      },
      {
        heading: "9. Ownership of Devices",
        content:
          "All hardware devices supplied by TriYantra remain the sole and exclusive property of TriYantra or its verified financing and supply partners. Clients receive temporary usage and operational rights strictly for the duration of the active agreement.",
      },
      {
        heading: "10. Returns & Pickup Process",
        content:
          "Upon agreement expiration or scheduled offboarding, devices must be returned in their original working condition (normal operational wear and tear excepted). Logistics pickup will be coordinated by TriYantra. Charges apply for missing power adapters or damaged components.",
      },
      {
        heading: "11. Termination of Services",
        content:
          "TriYantra reserves the right to terminate services in the event of persistent non-payment, material breach of contract, or unauthorized device misuse. Upon formal termination notice, all devices must be surrendered immediately and outstanding commercial balances cleared.",
      },
      {
        heading: "12. Limitation of Liability",
        content:
          "TriYantra shall not be liable for business interruptions, lost profits, data corruption, or indirect/consequential damages. Clients are solely responsible for maintaining enterprise data backups and adhering to their own software licensing protocols.",
      },
      {
        heading: "13. Data Protection & Confidentiality",
        content:
          "Client data is handled in strict compliance with our Privacy Policy. TriYantra engineers do not access, inspect, or store confidential customer data on deployed hardware unless expressly requested for diagnostic troubleshooting.",
      },
      {
        heading: "14. Force Majeure",
        content:
          "Neither party shall be held liable for failure or delay in fulfilling contractual obligations due to causes beyond reasonable control, including natural catastrophes, governmental restrictions, pandemics, or global supply chain embargoes.",
      },
      {
        heading: "15. Governing Law & Jurisdiction",
        content:
          "These Terms & Conditions are governed by and construed under the laws of India. Any legal proceedings or disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts in Bangalore, Karnataka.",
      },
      {
        heading: "16. Updates to Terms",
        content:
          "TriYantra reserves the right to revise these Terms & Conditions as business requirements and regulatory policies evolve. Current versions are maintained and accessible at all times on this page.",
      },
    ],
  },
  "accessibility-statement": {
    slug: "accessibility-statement",
    title: "Accessibility Statement",
    summary:
      "At TriYantra, we are committed to ensuring that our website and services are accessible to all users, including individuals with disabilities. We strive to provide an inclusive and seamless digital experience for everyone.",
    sections: [
      {
        heading: "1. Our Approach to Accessibility",
        content:
          "We actively design and develop our platform to enhance digital usability and accessible interaction by:",
        bulletPoints: [
          "Designing web pages with semantic structure, logical content hierarchy, and readable typography.",
          "Implementing keyboard-navigable interactive controls and clear focus rings.",
          "Ensuring responsive layout fidelity and multi-device browser compatibility.",
          "Regularly reviewing codebases against accessibility standards to identify and remediate barriers.",
        ],
      },
      {
        heading: "2. Standards & Technical Guidelines",
        content:
          "We aim to align our digital interfaces with widely recognized international accessibility standards, including the Web Content Accessibility Guidelines (WCAG 2.1 Level AA) and modern inclusive design principles. While we actively uphold these standards, continuous development ensures ongoing refinement across all interactive components.",
      },
      {
        heading: "3. Continuous Improvement",
        content:
          "Digital accessibility is an ongoing engineering commitment. We regularly conduct automated and manual audits across all viewports to refine usability, improve contrast ratios, and optimize screen reader compatibility.",
      },
      {
        heading: "4. Known Limitations",
        content:
          "Despite our continuous efforts, certain third-party integrations, external widgets, or legacy interactive tools may present temporary usability limitations. We are actively working with partner vendors to address and eliminate these constraints.",
      },
      {
        heading: "5. Browser & Device Compatibility",
        content:
          "The TriYantra web platform is engineered for compatibility with modern standards-compliant web browsers including Google Chrome, Apple Safari, Microsoft Edge, and Mozilla Firefox across desktop, tablet, and mobile devices. For optimal security and performance, we recommend keeping your browser updated.",
      },
      {
        heading: "6. Feedback & Accessibility Support",
        content:
          "If you encounter any difficulty navigating our website, accessing documentation, or utilizing assistive technologies, our team is ready to assist you:",
        bulletPoints: [
          "Email: info@triyantra.com",
          "Phone: +91 91645 43111",
          "Website: www.triyantra.com",
        ],
        note: "We value your user feedback and will make every reasonable effort to accommodate your requirements promptly.",
      },
      {
        heading: "7. Updates to This Statement",
        content:
          "TriYantra reviews and updates this Accessibility Statement periodically to reflect new improvements, testing results, and technology standards.",
      },
    ],
  },
  compliance: {
    slug: "compliance",
    title: "Regulatory & Enterprise Compliance",
    summary:
      "Matrix DaaS Private Limited adheres to enterprise-grade regulatory standards, statutory corporate guidelines, environmental responsibilities, and information security frameworks.",
    sections: [
      {
        heading: "1. Statutory Corporate Registrations",
        content:
          "Matrix DaaS Private Limited is duly incorporated under the Companies Act, 2013, with full statutory compliance including Ministry of Corporate Affairs (MCA) filings, Goods and Services Tax (GST) registration, and PAN/TAN tax compliance.",
      },
      {
        heading: "2. Information Security & Sanitization",
        content:
          "Enterprise data security is foundational to our Device-as-a-Service model. We enforce strict protocols for device deployment and decommissioning:",
        bulletPoints: [
          "Pre-deployment zero-touch provisioning and clean OS installation.",
          "End-of-lease certified data destruction conforming to NIST SP 800-88 Rev. 1 standards.",
          "Digital destruction certificates provided to enterprise IT audit teams upon request.",
        ],
      },
      {
        heading: "3. E-Waste Management & Environmental Standards",
        content:
          "TriYantra operates in strict compliance with the E-Waste (Management) Rules, 2022. Decommissioned hardware that has reached end-of-life is processed exclusively through authorized and certified recyclers (PRO-certified), ensuring zero toxic landfill disposal.",
      },
      {
        heading: "4. Supplier Network Due Diligence",
        content:
          "All hardware suppliers in the TriYantra ecosystem undergo verification for authorized distribution credentials, genuine component guarantees, and legitimate GST compliance.",
      },
    ],
  },
};
