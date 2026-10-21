# Scope and logic map

Product: TriYantra's public B2B procurement, rental, DaaS and asset-management website, for founders, IT, HR, procurement, finance and operations. A commercial requirement leads to a quote; platform interest leads to a demo request. No live inventory, customer metrics, pricing, testimonials, coverage or SLA claims.

Features: 12 required routes; four commercial services; two audience pages; platform with exactly three reusable conceptual portals; six-step interactive workflow; resource library with all 15 brief topics, filters, FAQs and related-service links; quote form with the exact 11 brief fields; demo form; guarded confirmation; 404; metadata, structured data, sitemap; minimal analytics hooks.

Logic: navigation → service/audience/resource → relevant platform or workflow → quote/demo form → native and shared validation → bounded same-origin API → configured authenticated HTTPS webhook → acknowledgment → receipt. Missing configuration or provider failure keeps data in the browser with an honest error, without a success event. No database is needed for this marketing build. Browser sample actions never mutate operational data.

Rules: Next.js App Router and TypeScript; server-rendered content, client components only for interactive areas; native elements and CSS; no legacy code/env/dependencies copied. Official logo bytes preserved. Extra commercial copy explains the approved operating model without adding promises. Technical docs and unavailable integration requirements belong in project docs; customer form shows concise service availability wording.

Production gates: record evidence in QA.md. Deployment, overnight QA, authorized form delivery, monitoring, recovery/backup of the destination, canonical domain and approved company contact/privacy information remain launch gates until verified. Source is in the private SIDDHUguts/triyantrav1 GitHub repository. The user deployed an earlier revision to triyantrav1.vercel.app; never publish private brief assets.

Skills update: the homepage has an HTML service story plus on-demand Three.js device illustration; GSAP coordinates bounded, reduced-motion-aware transitions. Existing three portal views are reused. The new illustration does not add an operational portal or backend. See SKILLS-REVIEW.md.
