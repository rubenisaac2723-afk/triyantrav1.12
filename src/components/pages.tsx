import Link from "next/link";
import {
  Actions,
  Arrow,
  Breadcrumb,
  FAQ,
  FinalCTA,
  Hero,
  PointList,
  SectionHead,
  SplitText,
} from "./shared";
import { services, modules, steps } from "@/lib/content";
import { AnimatedArrow } from "./animated-arrow";
import { DashboardShowcase } from "./dashboards";
import { ResourceLibrary } from "./resources";
import { LeadForm } from "./lead-form";
import { ContactBlueSkyBackground } from "./contact-blue-sky-background";
import { estimatorConfig } from "@/lib/estimator-config";
import { CostEstimator } from "./cost-estimator";
import { ContactOfficeMap } from "./contact-office-map";
export function ServicePage({
  service: s,
}: {
  service: (typeof services)[number];
}) {
  const href = "/contact?type=" + encodeURIComponent(s.type);
  return (
    <>
      <Breadcrumb label={s.label} />
      <Hero eyebrow={"Solutions / " + s.word} title={s.title} intro={s.intro}>
        <Actions primary={s.cta} href={href} />
      </Hero>
      <section className="service-detail wrap">
        <PointList points={s.details} headingLevel={2} />
        <aside className="checklist">
          <p className="eyebrow">A useful starting point</p>
          <h2>Bring us your requirement.</h2>
          <p>You don&apos;t need every answer to start the conversation.</p>
          <ul>
            {s.checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Link
            href={"/contact?type=" + encodeURIComponent(s.type)}
            className="text-link"
            data-cta={s.label + " quote"}
          >
            Get a Quote <Arrow />
          </Link>
        </aside>
      </section>
      <section className="audience-section section">
        <div className="wrap">
          <SectionHead
            eyebrow="Beyond the device"
            title="A connected operating workflow."
            text="Your requirement connects to supplier sourcing, fulfilment and device management. Explore how the three parts fit together."
          />
          <div className="related-links">
            <Link className="text-link" href="/platform">
              Explore the platform <Arrow direction="right" />
            </Link>
            <Link className="text-link" href="/how-it-works">
              How It Works <Arrow direction="right" />
            </Link>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <SectionHead
          eyebrow="Before you decide"
          title="A few helpful answers."
        />
        <FAQ />
      </section>
      <FinalCTA />
    </>
  );
}
export function PlatformPage() {
  return (
    <>
      <Breadcrumb label="Platform" />
      <Hero
        eyebrow="The TriYantra platform"
        title="Manage Workplace Technology From One Platform"
        intro="Procurement, supplier sourcing, employee assignments, and device lifecycles in one view."
      >
        <Actions secondaryLabel="How It Works" secondaryHref="/how-it-works" />
      </Hero>
      <section className="ecosystem-section section platform-showcase">
        <div className="wrap">
          <DashboardShowcase />
        </div>
      </section>
      <CostEstimator />
      <section className="section wrap" id="asset-management">
        <SectionHead
          eyebrow="Asset lifecycle visibility"
          title="Know where every device is and who is using it."
          text="Gain real-time visibility over every laptop, workstation and monitor in your organization—who has it, its physical location and its lifecycle status."
        />
        <PointList
          headingLevel={3}
          points={[
            [
              "A record for every device",
              "Link serial numbers, hardware specifications, warranty dates and commercial agreements in one searchable register.",
            ],
            [
              "An accountable assignment",
              "Assign devices to specific team members, departments and office locations. Track handovers, reallocations and offboarding returns.",
            ],
            [
              "Proactive lifecycle management",
              "Receive advance alerts for lease expirations, warranty renewals, scheduled maintenance and hardware returns.",
            ],
          ]}
        />
      </section>
      <section className="section wrap">
        <SectionHead
          eyebrow="The connecting layer"
          title="One operating layer connecting hardware and operations."
          text="TriYantra bridges customer requirements with supplier inventory and fleet tracking, replacing disjointed spreadsheets with a single coordinated workflow."
        />
        <p className="muted">
          Interactive concept. Operational scope and roadmap milestones are reviewed during a platform demo.
        </p>
        <div className="platform-modules">
          {modules.map((m, i) => (
            <article key={m}>
              <span className="number">0{i + 1}</span>
              <h3>{m}</h3>
              <span className="roadmap-label">Concept / roadmap</span>
              <p>
                {
                  [
                    "Coordinate verified vendor catalogues, availability, and fulfilment schedules.",
                    "Centralize fleet requirements, price comparisons, and purchase approvals.",
                    "Maintain detailed hardware specifications, serials, and configurations.",
                    "Map assets to specific employees, departments, and branch locations.",
                    "Monitor active custody, branch transfers, and storage reserve inventory.",
                    "Track monthly lease terms, billing milestones, and renewal options.",
                    "Consolidate commercial contracts, invoices, and delivery receipts.",
                    "Coordinate warranty repairs, peripheral swaps, and end-of-term returns.",
                    "Analyze fleet allocation, operational costs, and replacement schedules.",
                  ][i]
                }
              </p>
            </article>
          ))}
        </div>
        <div className="related-links">
          <Link className="text-link" href="/how-it-works">
            Follow the workflow <Arrow direction="right" />
          </Link>
          <Link
            className="text-link"
            href="/contact"
            data-cta="Platform capabilities demo"
          >
            Request a Platform Demo <Arrow direction="right" />
          </Link>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
export function HowItWorks() {
  return (
    <>
      <Breadcrumb label="How It Works" />
      <Hero
        eyebrow="From first request to next renewal"
        title="From Requirement to Managed Device"
        intro="A simpler way to procure, deploy and manage workplace technology."
      >
        <Actions demo={false} />
      </Hero>
      <section className="workflow wrap section">
        <div className="workflow-intro">
          <SectionHead
            eyebrow="One connected lifecycle"
            title="Every handoff has a next step."
            text="Follow the journey from a business requirement to an assigned device, then through the decisions that come next."
          />
          <Link href="/platform" className="text-link">
            See the three connected views <Arrow direction="right" />
          </Link>
        </div>
        <div>
          {steps.map(([title, text], i) => (
            <details key={title} open={i === 0}>
              <summary>
                <span className="number">0{i + 1}</span>
                {title}
                <AnimatedArrow direction="down" size="xs" />
              </summary>
              <p>{text}</p>
            </details>
          ))}
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <Breadcrumb label="About" />
      <Hero
        eyebrow="About TriYantra"
        title="A Connected Model for Workplace Technology"
        intro="Businesses shouldn't have to juggle fragmented vendors, opaque pricing, and manual tracking. TriYantra brings hardware access and lifecycle management into one system."
      />
      <section className="wrap">
        <p className="about-intro">
          By uniting vetted supplier inventory with centralized fleet management,
          TriYantra provides companies with flexible rental, procurement, and
          asset oversight under a single contract.
        </p>
        <div className="mission-grid">
          <article>
            <p className="eyebrow">Our mission</p>
            <h2>Predictable workplace technology.</h2>
            <p>
              Enable organizations to procure, deploy, and manage IT hardware
              with total commercial clarity.
            </p>
          </article>
          <article>
            <p className="eyebrow">Our vision</p>
            <h2>A unified hardware infrastructure.</h2>
            <p>
              The operating system businesses rely on to equip and manage their
              distributed workforce.
            </p>
          </article>
        </div>
      </section>
      <section className="section wrap">
        <SectionHead
          eyebrow="Our operating model"
          title="Right technology. Right supplier. Right visibility."
        />
        <PointList
          points={[
            [
              "Supplier-powered by design",
              "TriYantra connects business requirements to suitable supplier options, without positioning the business around a single hardware supplier.",
            ],
            [
              "A central technology layer",
              "The intended client-TriYantra-supplier ecosystem keeps procurement, fulfilment and device lifecycle context connected.",
            ],
            [
              "Built around the workplace",
              "Founders, IT, HR, procurement, finance and operations each bring a different requirement. The model brings those needs into one conversation.",
            ],
          ]}
        />
        <div className="related-links">
          <Link className="text-link" href="/platform">
            Explore the ecosystem <Arrow direction="right" />
          </Link>
          <Link className="text-link" href="/how-it-works">
            How It Works <Arrow direction="right" />
          </Link>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
export function ResourcesPage() {
  return (
    <>
      <Breadcrumb label="Resources" />
      <Hero
        eyebrow="The resource library"
        title="Workplace Technology Guides & Checklists"
        intro="Practical playbooks for IT procurement, hardware rental, Device-as-a-Service, and asset tracking."
      />
      <section className="wrap" id="blog">
        <nav className="resource-intro-links" aria-label="Resource sections">
          <span className="resource-nav-label">On this page</span>
          <a href="#guides">Guides</a>
          <a href="#faqs">FAQs</a>
          <a href="#device-guides">Device Guides</a>
          <a href="#it-procurement-insights">IT Procurement Insights</a>
        </nav>
        <div id="guides" className="resource-anchor">
          <ResourceLibrary />
        </div>
      </section>
      <section className="section wrap" id="device-guides">
        <SectionHead
          eyebrow="Device Guides"
          title="Hardware selection by business role."
          text="Determine compute specs, portability, and display needs based on actual employee workflows."
        />
        <PointList
          points={[
            [
              "Everyday business work",
              "Document the operating system, business applications, conferencing and connectivity your team relies on.",
            ],
            [
              "Performance and specialist roles",
              "Clarify compute, graphics, memory and storage needs with the people using the specialist applications.",
            ],
            [
              "The complete workstation",
              "Consider monitors, docks, input devices and the physical workspace alongside the laptop or desktop.",
            ],
          ]}
        />
        <Link className="text-link" href="/contact">
          Discuss a configuration <Arrow direction="right" />
        </Link>
      </section>
      <section
        className="audience-section section"
        id="it-procurement-insights"
      >
        <div className="wrap">
          <SectionHead
            eyebrow="IT Procurement Insights"
            title="Evaluate complete commercial terms."
            text="Account for configuration, warranty coverage, delivery lead times, and return policies before signing."
          />
          <Link
            className="text-link"
            href="/resources/corporate-laptop-procurement-checklist"
          >
            Open the procurement checklist <Arrow direction="right" />
          </Link>
        </div>
      </section>
      <section className="section wrap" id="faqs">
        <SectionHead eyebrow="FAQs" title="Your questions, answered." />
        <FAQ />
      </section>
      <FinalCTA />
    </>
  );
}
export function ContactPage({
  demo = false,
  query = {},
}: {
  demo?: boolean;
  query?: Record<string, string | string[] | undefined>;
}) {
  const isDemo = demo || query.demo === "true" || query.type === "Demo";
  const initial: Record<string, string> = {};
  if (
    typeof query.type === "string" &&
    ["Rent", "Purchase", "DaaS", "Asset Management", "Not Sure"].includes(
      query.type,
    )
  )
    initial.requirementType = query.type;
  if (isDemo && !initial.requirementType) initial.requirementType = "Not Sure";
  if (isDemo && !initial.message)
    initial.message = "I would like to schedule a platform walkthrough / demo.";
  if (typeof query.device === "string")
    initial.deviceType = query.device.slice(0, 500);
  if (typeof query.audience === "string")
    initial.message = "Business context: " + query.audience.slice(0, 100);
  if (typeof query.devices === "string" && /^[1-9]\d{0,4}$/.test(query.devices) && Number(query.devices) <= estimatorConfig.limits.quantity[1])
    initial.devices = query.devices;
  if (typeof query.months === "string" && /^[1-9]\d?$/.test(query.months) && Number(query.months) <= estimatorConfig.limits.durationMonths[1])
    initial.message = [initial.message, `Planning duration: ${query.months} months. Please confirm scope and pricing in a tailored quote.`].filter(Boolean).join("\n");
  return (
    <>
      <Breadcrumb label="Contact" />
      <link
        rel="preload"
        as="image"
        href="/assets/media/contact-blue-sky-poster.webp"
        type="image/webp"
        fetchPriority="high"
      />
      <section className="contact-cinematic-section">
        <ContactBlueSkyBackground />
        <div className="contact-canvas wrap">
          <div className="contact-canvas-copy">
            <p className="eyebrow">
              {isDemo ? "Interactive Walkthrough" : "Request a Proposal"}
            </p>
            <h1>
              <SplitText
                text={
                  isDemo
                    ? "See the platform workflow in action."
                    : "Request a Custom Hardware Quote"
                }
              />
            </h1>
            <p className="lead">
              {isDemo
                ? "Schedule a walkthrough to review fleet sourcing, employee assignment tracking, and our roadmap capabilities with a product specialist."
                : "Share your device requirements, team headcount, and target timeline. We will deliver a tailored rental, purchase, or DaaS proposal."}
            </p>
            <div className="contact-direct-channels">
              <a
                href="tel:+919164543111"
                className="contact-channel-card phone-channel"
                data-rgb
              >
                <span className="channel-icon-wrap phone-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <div className="channel-info">
                  <strong>Call Us</strong>
                  <p>+91 91645 43111</p>
                </div>
                <AnimatedArrow direction="right" size="sm" />
              </a>

              <a
                href="https://wa.me/919164543111?text=Hi%20TriYantra%20Team%2C%20I%27m%20interested%20in%20renting%20laptops%20for%20my%20business.%20Please%20share%20the%20available%20devices%2C%20pricing%20and%20quotation%20process."
                target="_blank"
                rel="noopener noreferrer"
                className="contact-channel-card whatsapp-channel"
                data-rgb
              >
                <span className="channel-icon-wrap whatsapp-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.747.953 3.71 1.456 5.71 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
                <div className="channel-info">
                  <strong>Chat on WhatsApp</strong>
                  <p>Start a conversation with our team about workplace devices, rental plans and fleet quotations.</p>
                </div>
                <AnimatedArrow direction="up-right" size="sm" />
              </a>
            </div>
            <ContactOfficeMap />
          </div>
          <div className="contact-form-wrapper">
            <LeadForm
              kind={isDemo ? "demo" : "quote"}
              initial={initial}
            />
          </div>
        </div>
      </section>
      <section className="contact-secondary-block wrap">
        <p className="eyebrow">What happens next</p>
        <h3>
          {isDemo
            ? "A conversation around your workflow."
            : "A clear requirement. A direct proposal."}
        </h3>
        <ol className="contact-steps-grid">
          <li className="contact-step-card">
            <span className="contact-step-num">01</span>
            <p className="contact-step-text">
              {isDemo
                ? "Select the workflows you want to explore."
                : "Submit device models, quantities, and timelines."}
            </p>
          </li>
          <li className="contact-step-card">
            <span className="contact-step-num">02</span>
            <p className="contact-step-text">
              {isDemo
                ? "Review live platform features and roadmap modules."
                : "Receive a comparative commercial proposal."}
            </p>
          </li>
          <li className="contact-step-card">
            <span className="contact-step-num">03</span>
            <p className="contact-step-text">
              {isDemo
                ? "Receive a tailored rollout recommendation."
                : "Confirm terms and finalize deployment dates."}
            </p>
          </li>
        </ol>
        <Link className="text-link" href={isDemo ? "/platform" : "/how-it-works"}>
          {isDemo ? "Explore the platform" : "How It Works"}
          <Arrow direction="right" />
        </Link>
      </section>
    </>
  );
}
