import Link from "next/link";
import { Arrow, ArrowAction, SectionHead } from "./shared";
import { HeroCinematic } from "./hero-cinematic";
import { InteractiveProductStory } from "./interactive-product-story";
import { WorkspaceOrbit } from "./workspace-orbit";
import { TrustedLogoMarquee } from "./trusted-logo-marquee";
import { deviceCategories, homeSteps } from "@/lib/content";
export function Home() {
  return (
    <>
      <HeroCinematic />
      <InteractiveProductStory />
      <section className="section wrap difference">
        <div>
          <SectionHead
            title="Not another hardware vendor."
            text="TriYantra coordinates a network of verified suppliers through one software layer, giving you flexible hardware access without single-vendor lock-in."
          />
          <Link className="text-link" href="/about">
            Meet TriYantra <Arrow direction="right" />
          </Link>
        </div>
        <div
          className="model-diagram"
          aria-label="Supplier-powered sourcing, one operating layer, predictable model and lifecycle visibility connect through TriYantra"
        >
          <div>
            <span>01</span>
            <h3>Supplier-powered</h3>
            <p>Right technology. Right supplier.</p>
          </div>
          <div>
            <span>02</span>
            <h3>One operating layer</h3>
            <p>Requirements to fulfilment.</p>
          </div>
          <div className="diagram-center">
            Rent. Procure. Manage.<span>One connected ecosystem</span>
          </div>
          <div>
            <span>03</span>
            <h3>Predictable model</h3>
            <p>Rental and DaaS options.</p>
          </div>
          <div>
            <span>04</span>
            <h3>Lifecycle visibility</h3>
            <p>Device, employee and status.</p>
          </div>
        </div>
      </section>
      <section className="daas-band wrap" id="daas-band">
        <div>
          <p className="eyebrow">Device-as-a-Service</p>
          <h2>
            Your IT infrastructure,
            <br />
            without the upfront investment.
          </h2>
          <p>
            Equip your workforce through predictable monthly subscriptions that
            include procurement, pre-configuration, maintenance, and planned
            refresh cycles.
          </p>
          <Link className="button light" href="/device-as-a-service" data-rgb>
            Explore Device-as-a-Service <Arrow direction="right" />
          </Link>
        </div>
        <WorkspaceOrbit />
      </section>
      <TrustedLogoMarquee />
      <section className="section wrap">
        <SectionHead title="A clear path, from day one." />
        <ol className="home-steps">
          {homeSteps.map((s, i) => (
            <li key={s}>
              <span>0{i + 1}</span>
              <h3>{s}</h3>
            </li>
          ))}
        </ol>
        <Link href="/how-it-works" className="text-link">
          Follow the complete journey <Arrow direction="right" />
        </Link>
      </section>
      <section className="section audience-section">
        <div className="wrap">
          <SectionHead title="Technology that fits your next chapter." />
          <div className="audience-grid">
            {[
              [
                "Startups",
                "Deploy essential hardware without capex.",
                "/contact?audience=Startups",
              ],
              [
                "Growing Businesses",
                "Consolidate your expanding fleet.",
                "/contact?audience=Growing%20businesses",
              ],
              [
                "Enterprises",
                "Standardize multi-team procurement.",
                "/contact?audience=Enterprises",
              ],
              [
                "Hybrid & Distributed Teams",
                "Ship and manage devices across locations.",
                "/contact?audience=Hybrid%20teams",
              ],
            ].map(([l, t, h], i) => (
              <Link key={l} href={h}>
                <span className="number">0{i + 1}</span>
                <h3>{l}</h3>
                <p>{t}</p>
                <ArrowAction />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section wrap devices-section">
        <SectionHead title="The right device for the work." />
        <div className="category-list">
          {deviceCategories.map((d, i) => (
            <Link href={"/contact?device=" + encodeURIComponent(d)} key={d}>
              <span>0{i + 1}</span>
              <span className="category-name">{d}</span>
              <Arrow direction="up-right" size="sm" />
            </Link>
          ))}
        </div>
        <p className="muted">
          Configurations and availability are confirmed against your
          requirement.
        </p>
      </section>
    </>
  );
}
