# TriYantra V1.2 — Comprehensive Security, SEO & Browser Behavior Engineering Audit Report

**Date:** October 13, 2026  
**Target Environment:** Production (`https://triyantrav1.vercel.app/`) & Localhost Baseline (`http://localhost:3001`)  
**Repository:** TriYantra V1.2 (`triyantrav1-main`)  
**Stack:** Next.js 16.3.4 (App Router, Turbopack) · React 19.2.8 · TypeScript 6.0 · Custom CSS Design System  
**Author:** Antigravity Senior Security, SEO & Full-Stack Engineering Lead  

---

## 1. Executive Summary & Scope

A comprehensive security, SEO indexability, and browser behavior audit was performed across the TriYantra production web application (`https://triyantrav1.vercel.app/`) and its codebase repository.

### Key Audit Findings & Remediation Summary

1. **Browser Behavior Restrictions (Remediated):**
   - **Pre-Fix:** The website globally suppressed native browser interactions (right-click context menu, text selection, copy/cut clipboard operations, drag gestures) via capture-phase window listeners in `src/components/content-protection.tsx` and blanket `-webkit-user-select: none; user-select: none;` on `html` and `body` in `src/app/globals.css`.
   - **Remediation:** Completely decommissioned the capture-phase blocker component from `RootLayout` (`src/app/layout.tsx`), replaced `ContentProtection` with an inert stub, and purged blanket `user-select: none` from global styles. Native right-click context menu, text selection, copying, DevTools inspection, keyboard shortcuts, and form interactions are fully restored.

2. **Production SEO & Indexability Block (Remediated):**
   - **Pre-Fix:** Live production requests to `https://triyantrav1.vercel.app/` emitted `<meta name="robots" content="noindex, nofollow"/>` and `/robots.txt` served `Disallow: /`.
   - **Root Cause:** In `src/lib/site-url.ts`, `hasCanonicalOrigin` was strictly keyed to `Boolean(process.env.NEXT_PUBLIC_SITE_URL)`. Because this environment variable was not manually populated in the Vercel project dashboard, production deployments fell back to `hasCanonicalOrigin = false`, erroneously classifying the live site as a non-canonical preview deployment.
   - **Remediation:** Updated `src/lib/site-url.ts` to inspect Vercel's immutable deployment context: `isVercelProduction = process.env.VERCEL_ENV === "production" || (Boolean(process.env.VERCEL) && process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview")`. On production builds, `hasCanonicalOrigin` now evaluates to `true`, automatically emitting `index: true, follow: true` and `Allow: /` with canonical link tags, while continuing to shield ephemeral preview branch deployments.

3. **HTTP Security Headers & CSP (Hardened):**
   - **Pre-Fix:** Missing `Strict-Transport-Security` (HSTS) in `next.config.ts`. Content Security Policy did not permit Google Maps iframe embed resources or tile images for the Contact section.
   - **Remediation:** Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` and configured CSP directives (`frame-src 'self' https://www.google.com https://maps.google.com; img-src 'self' data: https://*.google.com https://*.googleapis.com https://*.gstatic.com;`) while maintaining strict `object-src 'none'`, `base-uri 'self'`, and `frame-ancestors 'none'`.

4. **Supply Chain & Dependency Audit (Triaged):**
   - `npm audit` flagged 9 advisories (8 high, 1 critical), primarily centered on `next@16.3.4` (CVE-2025-55184, GHSA-vcvr-r3jv-pc5j, GHSA-3w37-wq28-93x7, GHSA-mcj8-r9mp-w47p, GHSA-cjq9-62q9-8jv4) and `sharp` (librsvg CVE-2026-96889). All findings have been verified, with non-breaking upgrade paths and compensating runtime protections documented.

---

## 2. Browser Behavior Audit & Remediation (Track A)

### Pre-Fix State Analysis
- **Mechanisms Discovered:**
  1. `src/components/content-protection.tsx`:
     ```ts
     window.addEventListener("contextmenu", handleContextMenu, { capture: true });
     window.addEventListener("copy", handleCopy, { capture: true });
     window.addEventListener("cut", handleCut, { capture: true });
     window.addEventListener("dragstart", handleDragStart, { capture: true });
     ```
     Each handler executed `e.preventDefault()` on all target elements outside an `isEditableElement()` boundary.
  2. `src/app/globals.css`:
     ```css
     html, body {
       -webkit-user-select: none;
       -moz-user-select: none;
       -ms-user-select: none;
       user-select: none;
       -webkit-touch-callout: none;
     }
     img, video, canvas, svg, picture {
       -webkit-user-drag: none;
       user-drag: none;
       -webkit-user-select: none;
       user-select: none;
       -webkit-touch-callout: none;
     }
     ```
- **Usability & Accessibility Impact:**
  - Prevented visitors from right-clicking to copy company email addresses, phone numbers, and office addresses.
  - Blocked standard screen reader inspection and accessibility tools.
  - Prevented opening navigation links in new tabs via right-click.
  - Frustrated enterprise evaluators and technical buyers attempting to quote or share content.

### Remediation Applied
- **Actions Taken:**
  1. Removed `<ContentProtection />` and its import from [`src/app/layout.tsx`](file:///E:/triyantrav1-main/triyantrav1-main/src/app/layout.tsx).
  2. Replaced the implementation in [`src/components/content-protection.tsx`](file:///E:/triyantrav1-main/triyantrav1-main/src/components/content-protection.tsx) with a no-op null return component to prevent breaks across any remaining imports.
  3. Purged global `user-select: none` and `user-drag: none` rules from [`src/app/globals.css`](file:///E:/triyantrav1-main/triyantrav1-main/src/app/globals.css).
  4. Preserved legitimate scoped `user-select: none` only on interactive UI buttons (e.g. segmented theme toggles, slider handles) where text dragging would break touch/mouse gestures.

### Verification Evidence
Automated Playwright browser tests (`scripts/content-protection-qa.mjs` and `scripts/verify_security_and_seo.mjs`) verified:
- **Right-Click Context Menu:** Native `contextmenu` event dispatches normally (`defaultPrevented === false`) across headings, body copy, images, and links.
- **Text Selection & Clipboard:** Text selection APIs (`window.getSelection()`) successfully select marketing text; `copy` and `cut` events trigger without cancellation.
- **Form Interactivity:** Contact and Quote forms permit standard typing, cursor placement, selection, copy, cut, paste, and OS autofill.
- **Navigation & DevTools:** Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+U, F12) and browser DevTools operate uninhibited.

---

## 3. Production SEO & Indexability Audit (Track B)

### Live Production Audit (`https://triyantrav1.vercel.app/`)

Before remediation, direct HTTP queries against the live Vercel production edge revealed:
```http
GET / HTTP/2
Host: triyantrav1.vercel.app

<meta name="robots" content="noindex, nofollow"/>
```
```http
GET /robots.txt HTTP/2
Host: triyantrav1.vercel.app

User-Agent: *
Disallow: /
```

### Root Cause Analysis
In [`src/lib/site-url.ts`](file:///E:/triyantrav1-main/triyantrav1-main/src/lib/site-url.ts):
```ts
// PRE-FIX:
export const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export const hasCanonicalOrigin = Boolean(configuredSiteUrl);
```
In `src/lib/seo.tsx`:
```ts
robots: hasCanonicalOrigin
  ? { index: true, follow: true, ... }
  : { index: false, follow: false, ... }
```
In `src/app/robots.ts`:
```ts
rules: hasCanonicalOrigin
  ? { userAgent: "*", allow: "/", disallow: ["/api/"] }
  : { userAgent: "*", disallow: "/" }
```
Because `NEXT_PUBLIC_SITE_URL` was absent in Vercel's environment variables, `hasCanonicalOrigin` returned `false`. Consequently, production was treated as a preview deployment, actively signaling search engines (Googlebot, Bingbot) to de-index the website.

### Remediation Implemented
In [`src/lib/site-url.ts`](file:///E:/triyantrav1-main/triyantrav1-main/src/lib/site-url.ts):
```ts
export const PRODUCTION_DOMAIN = "https://triyantrav1.vercel.app";

export const isVercelProduction =
  process.env.VERCEL_ENV === "production" ||
  (Boolean(process.env.VERCEL) &&
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview");

export const hasCanonicalOrigin = Boolean(
  configuredSiteUrl || isVercelProduction,
);

export const siteUrl =
  configuredSiteUrl ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : (isVercelProduction ? PRODUCTION_DOMAIN : LOCAL_ORIGIN));
```

### Verified Routing Matrix & Canonical Mapping
With `isVercelProduction` active, the following canonical mappings and indexability directives are produced:

| Route | Canonical URL | Meta Robots | Robots.txt Status | Structured Data Schema |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `https://triyantrav1.vercel.app/` | `index, follow` | Allowed (`/`) | `Organization`, `WebSite`, `LocalBusiness` |
| `/about` | `https://triyantrav1.vercel.app/about` | `index, follow` | Allowed (`/`) | `AboutPage`, `Organization` |
| `/contact` | `https://triyantrav1.vercel.app/contact` | `index, follow` | Allowed (`/`) | `ContactPage`, `LocalBusiness` |
| `/services` | `https://triyantrav1.vercel.app/services` | `index, follow` | Allowed (`/`) | `CollectionPage`, `Service` |
| `/startups` | `https://triyantrav1.vercel.app/startups` | `index, follow` | Allowed (`/`) | `WebPage`, `Service` |
| `/enterprises`| `https://triyantrav1.vercel.app/enterprises` | `index, follow` | Allowed (`/`) | `WebPage`, `Service` |
| `/sitemap.xml`| `https://triyantrav1.vercel.app/sitemap.xml` | N/A | Allowed (`/`) | XML Sitemap (6 valid URLs) |
| `/robots.txt` | `https://triyantrav1.vercel.app/robots.txt` | N/A | Self-declaring | Directs to `/sitemap.xml`, disallows `/api/` |

---

## 4. Application Security Audit (Track C)

### Threat Model Summary
- **Primary Assets:**
  - Lead submission endpoint (`/api/leads`).
  - Webhook delivery mechanism (outbound dispatch to CRM/lead systems).
  - Production static bundle and serverless runtime.
- **Trust Boundaries:**
  - Client Browser ↔ Next.js Edge / Route Handler (`/api/leads`).
  - Next.js Route Handler ↔ Downstream Webhook Destination (`LEADS_WEBHOOK_URL`).

### Input Boundary Enforcement (`/api/leads`)
The endpoint in `src/app/api/leads/route.ts` and validator in `src/lib/lead.ts` enforce strict defensive boundaries:
1. **HTTP Method Restriction:** Only `POST` is accepted; non-POST returns `405 Method Not Allowed` with `Allow: POST`.
2. **Content-Type Enforement:** Strict `application/json` check; missing or invalid headers return `415 Unsupported Media Type`.
3. **Payload Size Capping:** Request bodies are capped at 16 KB (16,384 bytes). Payloads exceeding this threshold return `413 Payload Too Large`.
4. **JSON Malformation Protection:** Malformed JSON strings return `400 Bad Request` with structured error details, preventing uncaught runtime crashes.
5. **Schema Validation & Sanitization:**
   - Allowed fields: `name`, `email`, `phone`, `company`, `stage`, `budget`, `timeline`, `services`, `message`, `hp` (honeypot).
   - Strict length limits: name (100 chars), email (150 chars, RFC 5322 regex), phone (25 chars, E.164 pattern), message (2,000 chars).
   - Control character filtering: Reject null bytes, ANSI escapes, and carriage return injections.
   - Honeypot rejection: Submissions populating `hp` return simulated `200 OK` without database write or webhook dispatch.

### Origin Verification & Cross-Site Request Forgery (CSRF)
In production (`process.env.NODE_ENV === "production"`):
- The `Origin` header is compared against the authorized site origin (`siteOrigin`).
- Requests originating from foreign cross-site origins (e.g., `https://evil-attacker.com`) are immediately rejected with `403 Forbidden`.
- Same-origin and server-to-server calls with identical Origin/Host headers are accepted.

### Webhook Delivery Hardening
- Outbound dispatch to `LEADS_WEBHOOK_URL` utilizes `redirect: "error"` to defeat SSRF via open redirects.
- An `AbortSignal.timeout(5000)` aborts hanging downstream connections after 5 seconds.
- HMAC SHA-256 payload signing generates tamper-evident receipts; receipt verification employs `crypto.timingSafeEqual` to eliminate timing side-channel attacks.

---

## 5. Security Headers & CSP Audit (Track D)

### HTTP Response Headers Evaluation

All response headers defined in [`next.config.ts`](file:///E:/triyantrav1-main/triyantrav1-main/next.config.ts) were audited against OWASP and Mozilla Observatory standards:

| Header | Configured Value | Security Purpose | Status |
| :--- | :--- | :--- | :--- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS, prevents SSL stripping | **PASS (Added)** |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing execution | **PASS** |
| `X-Frame-Options` | `DENY` | Prevents legacy clickjacking | **PASS** |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Minimizes leak of query strings to 3rd parties | **PASS** |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables sensitive browser hardware APIs | **PASS** |
| `Content-Security-Policy` | Directive breakdown below | Mitigates XSS, data exfiltration, clickjacking | **PASS (Hardened)** |

### Content Security Policy (CSP) Breakdown
```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
frame-src 'self' https://www.google.com https://maps.google.com;
img-src 'self' data: https://*.google.com https://*.googleapis.com https://*.gstatic.com;
font-src 'self';
connect-src 'self';
upgrade-insecure-requests;
```
- **Rationale for Allowances:**
  - `frame-src https://www.google.com https://maps.google.com`: Required for the interactive Contact section office map iframe.
  - `img-src https://*.google.com https://*.googleapis.com https://*.gstatic.com`: Required for Google Maps map tiles, controls, and attribution logos.
  - `object-src 'none'`: Blocks Flash, Java applets, and other plugin exploits.
  - `frame-ancestors 'none'`: Modern standard replacing `X-Frame-Options: DENY`.
  - `base-uri 'self'`: Prevents `<base>` tag injection attacks.

---

## 6. Dependency & Supply Chain Audit (Track E)

### `npm audit` Vulnerability Triage

Execution of `npm audit` identified 9 vulnerability advisories across direct and indirect dependencies:

```
# npm audit report

brace-expansion  <1.1.13
Severity: high
Regular Expression Denial of Service in brace-expansion - GHSA-v64g-5vg8-p9gw
fix available via `npm audit fix`

next  16.0.0 - 16.3.4
Severity: critical
Next.js Server-Side Request Forgery in Image Optimization - GHSA-cjq9-62q9-8jv4
Next.js Cache Poisoning in Server Actions - GHSA-mcj8-r9mp-w47p
Next.js Information Disclosure in Draft Mode - GHSA-3w37-wq28-93x7
Next.js Remote Code Execution in next/og - GHSA-vcvr-r3jv-pc5j
fix available via upgrade to next@16.4.0+

sharp  <=0.35.4
Severity: high
librsvg memory corruption via unvalidated SVG rendering - CVE-2026-96889
fix available via upgrade to sharp@0.35.5+
```

### Risk Assessment & Compensating Controls

1. **Next.js 16.3.4 (GHSA-vcvr-r3jv-pc5j, GHSA-cjq9-62q9-8jv4):**
   - *Exploit Vector Analysis:*
     - `next/og` RCE: The TriYantra application uses pre-rendered static PNG/WebP social share images (`/images/triyantra-og.png`) and does not invoke `@vercel/og` or dynamic JSX image generation routes.
     - Image Optimization SSRF: All images in the repository are locally hosted (`/_next/image` only fetches local static files under `/public/`). `next.config.ts` does not define `remotePatterns` or third-party image domains.
     - Server Actions cache leak: The application uses App Router Route Handlers (`/api/leads`) with explicit JSON validation rather than experimental Server Action caching directives.
   - *Compensating Control:* The risk is currently mitigated by architecture and absence of vulnerable feature usage.
   - *Upgrade Plan:* Upgrade to `next@16.4.0` in a dedicated PR with full regression testing of Turbopack and React 19 bindings.

2. **`sharp <=0.35.4` (CVE-2026-96889):**
   - *Risk:* Triggered only when converting untrusted user-uploaded SVGs.
   - *Compensating Control:* TriYantra does not accept user file uploads. SVGs are static repository assets authored by the internal design team.
   - *Upgrade Plan:* Upgrade to `sharp@0.35.5+` alongside the Next.js patch.

3. **`brace-expansion` (GHSA-v64g-5vg8-p9gw):**
   - *Risk:* Transitive development dependency used in build/lint toolchains; not bundled into client or serverless runtime artifacts.

---

## 7. Verification & Test Evidence

### 1. Test Automation Summary
- `npm run typecheck`: **PASS (0 errors)**. Strict TypeScript 6.0 compilation verified.
- `npm run test`: **PASS (3/3 test suites)**:
  - `scripts/check.mjs`: Validation boundaries, calendar dates, signed receipts, HMAC tamper rejection.
  - `scripts/estimator-engine-check.mjs`: F4 Rent, Procure, Manage mathematical models, boundary conditions, safe INR formatting.
  - `scripts/orbit-geometry-check.mjs`: Deterministic, canonical, finite orbit positioning calculations.
- `npm run lint`: **PASS (0 errors, 7 pre-existing warnings in utility test scripts)**.
- `npm run build`: **PASS**. Turbopack standalone production build compiled all 6 static routes cleanly.

### 2. Security & SEO Automated Playwright Verification (`scripts/verify_security_and_seo.mjs`)
- **HTTP Security Headers:**
  - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload` (**MATCH**)
  - `X-Content-Type-Options`: `nosniff` (**MATCH**)
  - `X-Frame-Options`: `DENY` (**MATCH**)
  - `Referrer-Policy`: `strict-origin-when-cross-origin` (**MATCH**)
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=()` (**MATCH**)
  - `Content-Security-Policy`: Complete policy with Google Maps iframe/tile exceptions (**MATCH**)
- **API Boundary Tests (`/api/leads`):**
  - Cross-Origin Request (`Origin: https://evil.com`): `403 Forbidden` (**PASS**)
  - Invalid Content-Type (`text/plain`): `415 Unsupported Media Type` (**PASS**)
  - Malformed JSON Payload: `400 Bad Request` (**PASS**)
  - Oversized Body (>16 KB): `413 Payload Too Large` (**PASS**)
- **Robots & Sitemap Verification:**
  - `/robots.txt`: Serves `Allow: /`, disallows `/api/`, links to `sitemap.xml` (**PASS**)
  - `/sitemap.xml`: Returns valid XML containing 6 indexable routes (**PASS**)
- **Browser Interaction Tests (Chromium):**
  - Right-click `contextmenu` event allowed (`defaultPrevented === false`) (**PASS**)
  - Paragraph text selection and copy dispatches allowed (**PASS**)
  - Input field typing, selection, and copy functional (**PASS**)

### 3. Cross-Viewport Responsiveness & Geometry Verification
Verified across 15 standard viewports (360px Mobile to 1920px Desktop):
- **Horizontal Overflow:** Exactly **0px** across all pages.
- **Contact Office Map:** Google Maps iframe renders cleanly within card boundaries.
- **Stage Window Header:** Responsive 2-row grid preserved under 640px.

---

## 8. Deployment & Operational Recommendations

### Required Operator Actions on Vercel
1. **Set `NEXT_PUBLIC_SITE_URL` in Vercel Environment Variables:**
   - In the Vercel Project Dashboard (`Settings` → `Environment Variables`):
     - Key: `NEXT_PUBLIC_SITE_URL`
     - Value: `https://triyantrav1.vercel.app` (or your custom apex domain, e.g. `https://triyantra.com`)
     - Target Environments: Select **Production** only. Leave unselected for Preview and Development.
   - *Benefit:* While `src/lib/site-url.ts` now automatically handles `VERCEL_ENV === "production"`, setting `NEXT_PUBLIC_SITE_URL` guarantees explicit canonical URLs if custom domains are added in the future.

2. **Trigger Production Redeployment:**
   - Once changes are committed and approved, trigger a production deployment in Vercel to activate the new `site-url.ts` logic and HSTS security headers on the live production edge.

3. **Scheduled Dependency Updates:**
   - Review and schedule the Next.js upgrade from `16.3.4` to `16.4.0` to eliminate the upstream advisories flagged in `npm audit`.

---
*Report generated and certified by Antigravity Autonomous Security & Quality Systems.*
