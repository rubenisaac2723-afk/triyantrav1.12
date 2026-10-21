"use client";

import Image from "next/image";
import { verifiedLogos } from "@/lib/marquee-data";
import "./trusted-logo-marquee.css";

const FALLBACK_CAPABILITIES = [
  "Device procurement",
  "Hardware subscription",
  "Lifecycle management",
  "Asset tracking",
];

export function TrustedLogoMarquee() {
  const hasVerifiedLogos = verifiedLogos.length > 0;

  const renderLogoSet = (keyBase: string) =>
    verifiedLogos.map((logo) => (
      <div key={`${keyBase}-${logo.name}`} className="marquee-card">
        <Image
          src={logo.logoSrc}
          alt={keyBase === "primary" ? logo.alt : ""}
          width={logo.width ?? 120}
          height={logo.height ?? 36}
          className="marquee-logo-image"
          draggable={false}
        />
      </div>
    ));

  return (
    <section
      id="trusted-ecosystem"
      className="trusted-marquee-section"
      data-logo-rail={hasVerifiedLogos ? "true" : "false"}
      aria-label="Connected ecosystem behind your workplace"
    >
      <div className="marquee-bg-layers" aria-hidden="true">
        <div className="marquee-texture-drift" />
        <div className="marquee-overlay-scrim" />
      </div>

      <div className="marquee-header-container wrap">
        <span className="marquee-eyebrow">
          <span className="status-dot" aria-hidden="true" />
          TriYantra Ecosystem
        </span>
        <h2 className="marquee-title">
          Connected capabilities behind your workplace.
        </h2>
        <p className="marquee-note">
          Device supply, hardware subscription and lifecycle services,
          coordinated in one connected workflow.
        </p>
        {!hasVerifiedLogos && (
          <span className="marquee-status-badge">
            Partner &amp; client brand assets pending verified onboarding
          </span>
        )}
      </div>

      {hasVerifiedLogos ? (
        <div className="marquee-rail-wrapper">
          <div className="marquee-track-container">
            <div className="marquee-track-set">{renderLogoSet("primary")}</div>
            <div className="marquee-track-set" aria-hidden="true">
              {renderLogoSet("dup")}
            </div>
          </div>
        </div>
      ) : (
        <div className="marquee-static-rail" role="status">
          <p className="marquee-awaiting">
            REAL LOGO RAIL: AWAITING APPROVED LOGOS
          </p>
          <p className="marquee-capability-line">
            {FALLBACK_CAPABILITIES.join(" · ")}
          </p>
          <p className="marquee-capability-note">
            Sourcing, fulfilment, support and renewals, coordinated through one
            platform.
          </p>
        </div>
      )}
    </section>
  );
}
