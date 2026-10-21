import React from "react";
import { Breadcrumb, Hero, Actions } from "./shared";
import { legalDocuments } from "@/lib/legal-data";

export function LegalPage({ slug }: { slug: string }) {
  const doc = legalDocuments[slug];

  if (!doc) {
    return null;
  }

  return (
    <>
      <Breadcrumb label={doc.title} />
      <Hero
        eyebrow="Legal & Governance"
        title={doc.title}
        intro={doc.summary}
      />
      <div
        className="wrap legal-document-shell"
        style={{
          maxWidth: "860px",
          marginInline: "auto",
          paddingBlock: "40px 80px",
        }}
      >
        <p
          className="legal-last-updated"
          style={{
            fontSize: "0.875rem",
            color: "var(--muted, #64748b)",
            marginBottom: "32px",
          }}
        >
          {doc.lastUpdated ? (
            <>
              Last Updated: <strong>{doc.lastUpdated}</strong> · Matrix DaaS
              Private Limited
            </>
          ) : (
            <>Matrix DaaS Private Limited · Official Operations Policy</>
          )}
        </p>

        <div
          className="legal-sections"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            lineHeight: "1.7",
          }}
        >
          {doc.sections.map((sec) => (
            <section key={sec.heading} className="legal-section-block">
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "var(--color-ink, #0a0b0c)",
                  marginBottom: "12px",
                }}
              >
                {sec.heading}
              </h2>
              <p
                style={{
                  color: "var(--muted, #475569)",
                  marginBottom: sec.bulletPoints || sec.note ? "12px" : "0",
                }}
              >
                {sec.content}
              </p>
              {sec.bulletPoints && (
                <ul
                  style={{
                    paddingLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    color: "var(--muted, #475569)",
                  }}
                >
                  {sec.bulletPoints.map((bp) => (
                    <li key={bp}>{bp}</li>
                  ))}
                </ul>
              )}
              {sec.note && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 16px",
                    background: "var(--surface-sunken, #f8fafc)",
                    borderLeft: "3px solid var(--accent, #145aff)",
                    borderRadius: "4px",
                    fontSize: "0.9375rem",
                    color: "var(--ink, #0f172a)",
                  }}
                >
                  {sec.note}
                </div>
              )}
            </section>
          ))}
        </div>

        <div
          className="legal-footer-contact"
          style={{
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid var(--border-color, rgba(1, 48, 104, 0.1))",
          }}
        >
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--muted, #475569)",
              marginBottom: "16px",
            }}
          >
            Have questions regarding our legal agreements, equipment lease
            terms, or operational policies?
          </p>
          <Actions
            primary="Contact Legal Team"
            href="/contact?type=Compliance"
          />
        </div>
      </div>
    </>
  );
}
