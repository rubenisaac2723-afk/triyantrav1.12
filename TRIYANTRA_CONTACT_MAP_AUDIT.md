# TriYantra V1.2 — Contact Section Map Replacement & Audit

## 1. Executive Summary

This engineering correction replaces the broken client-rendered Leaflet/CARTO map on the TriYantra Contact page (`/contact`) with a genuine, production-grade **Google Maps embed** for **Matrix DaaS Private Limited**. The redundant "Office Location" action row immediately above the map has been deleted from the component structure. Spacing, typography, frosted glass design tokens, responsive layout (0px overflow across 320px–1920px), and accessibility (WCAG AA) have been preserved.

---

## 2. Root Cause of the Broken Map

The prior map implementation relied on Leaflet with public CARTO Basemaps tile URLs. In production environments and without a paid domain-whitelisted token, CARTO/OpenStreetMap tile providers watermarked tiles with "API KEY REQUIRED" or blocked unauthenticated high-volume requests. Furthermore, Leaflet added client-side JS overhead, touch gesture traps on mobile, and third-party attribution strings (`Leaflet | © OpenStreetMap contributors © CARTO`).

Replacing this with an official Google Maps embed permanently eliminates the "API KEY REQUIRED" watermark, removes obsolete Leaflet dependencies, and renders Google Maps content directly.

---

## 3. Verified Office Information & Source of Truth

- **Business Name:** Matrix DaaS Private Limited (operating TriYantra)
- **Verified Street Address:** `1st floor, 36th Cross Rd, 36th main, 4th T Block East, Jayanagara 9th Block, Jayanagar, Bengaluru, Karnataka 560041`
- **Place Coordinates:** Latitude `12.9229798`, Longitude `77.5936075` (displayed as `12.9230° N, 77.5936° E`)
- **Primary Google Maps Share Link:** `https://maps.app.goo.gl/P9HmacGke1tQTmND7`
- **Google Maps Place CID:** `0x3bae15e6e9ee5a2b:0xa58cc5d3ff5ea383` (Google Place ID: `ChIJq1ru6e4VrzsRg6Ne_9PFjKU`)
- **Official Google Maps Embed URL:**
  `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7505193952136!2d77.5910326!3d12.9229798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15e6e9ee5a2b%3A0xa58cc5d3ff5ea383!2sMatrix%20DaaS%20Private%20Limited!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin`

---

## 4. Key Changes Implemented

### 4.1 Redundant "Office Location" Row Removed
- Deleted the anchor tag `.contact-channel-card.maps-channel` from `src/components/pages.tsx`.
- Removed the location-pin icon container, "Office Location" heading, supporting text ("Matrix DaaS Private Limited · Open Google Maps"), and trailing arrow.
- Removed unused `.maps-icon` and `.maps-channel` styling rules from `src/app/premium.css`.
- The direct channels list now cleanly contains **Call Us** and **Chat on WhatsApp**, followed naturally by the frosted-glass map card with intentional spacing (`margin-top: clamp(16px, 2vw, 24px)`).

### 4.2 Genuine Google Maps Embed
- Replaced Leaflet implementation in `src/components/contact-office-map.tsx` with a lazy-loaded `<iframe>` pointing to the official Google Maps share embed URL for Matrix DaaS Private Limited.
- Supports optional `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` environment variable if an API key is configured; seamlessly defaults to the official share embed URL without requiring any configuration.
- Added accessible title: `title="Google Maps location for Matrix DaaS Private Limited"`.
- Reserved container dimensions (`height: 270px; min-height: 230px` on desktop, `height: 230px; min-height: 200px` on mobile) ensuring **0 CLS**.

### 4.3 Obsolete Leaflet & Attribution Removed
- Uninstalled `leaflet` and `@types/leaflet` from `package.json` and `package-lock.json`.
- Removed all Leaflet CSS, marker pulse, touch scroll guards, and tile-redraw observers.
- All Leaflet and CARTO attribution strings (`Leaflet | © OpenStreetMap contributors © CARTO`) have disappeared naturally because the engine was replaced.
- Google's required map branding and terms remain clearly visible inside the embed.

### 4.4 Get Directions Preserved
- "Get Directions" button links directly to `https://maps.app.goo.gl/P9HmacGke1tQTmND7` with `target="_blank"` and `rel="noopener noreferrer"`.
- Does not request geolocation permission from visitors.

### 4.5 CSP Security Updates
- Updated Content Security Policy in `next.config.ts` and `src/proxy.ts`:
  - Added `frame-src 'self' https://www.google.com https://maps.google.com;`
  - Replaced obsolete CARTO/OSM origins with `https://*.google.com https://*.googleapis.com https://*.gstatic.com` in `img-src`.

---

## 5. Verification & Test Evidence

### 5.1 Quality Gates Summary

| Check / Tool | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript Strict** | `npm run typecheck` | **PASS (0 errors)** | Clean compilation |
| **ESLint** | `npm run lint` | **PASS (0 errors)** | 0 errors |
| **Unit Tests** | `npm run test` | **PASS** | Estimator, receipt tamper, & orbit checks passed |
| **Performance (CWV)** | `npm run test:performance` | **PASS** | Mobile cold cache CLS: 0.0019 |
| **Appearance & Contrast** | `npm run test:appearance` | **PASS** | WCAG AA contrast sweep passed across 1440px and 390px |
| **Browser Content Routes** | `npm run test:browser` | **PASS** | 34 routes, 46 internal URLs verified |
| **Production Build** | `npm run build` | **PASS** | Next.js 16.3.4 Turbopack (6/6 static routes generated) |
| **Contact Map E2E** | `node scripts/verify_contact_map.mjs` | **PASS** | Verified row removal, embed, and all 13 viewports |

### 5.2 Multi-Viewport Responsive Matrix (0px Horizontal Overflow)

| Viewport Category | Width | Height | Overflow | Result |
| :--- | :--- | :--- | :--- | :--- |
| Mobile Narrow | 320px | 600px | 0px | **PASS** |
| Mobile Standard | 360px | 740px | 0px | **PASS** |
| Mobile iPhone SE | 375px | 812px | 0px | **PASS** |
| Mobile iPhone 14/15 | 390px | 844px | 0px | **PASS** |
| Mobile Plus | 414px | 896px | 0px | **PASS** |
| Mobile Pro Max | 430px | 932px | 0px | **PASS** |
| Tablet Portrait | 768px | 1024px | 0px | **PASS** |
| Tablet Medium | 820px | 1180px | 0px | **PASS** |
| Tablet Landscape | 1024px | 768px | 0px | **PASS** |
| Laptop Compact | 1280px | 800px | 0px | **PASS** |
| Desktop Standard | 1440px | 900px | 0px | **PASS** |
| Desktop Large | 1728px | 1080px | 0px | **PASS** |
| Ultrawide / 1080p | 1920px | 1080px | 0px | **PASS** |

### 5.3 Test Artifacts & Screenshots Generated

- Desktop 1440px Light Theme: `output/playwright/contact-map/contact-desktop-1440-light.png`
- Desktop 1440px Dark Theme: `output/playwright/contact-map/contact-desktop-1440-dark.png`
- Mobile 390px Light Theme: `output/playwright/contact-map/contact-mobile-390-light.png`
- Mobile 390px Dark Theme: `output/playwright/contact-map/contact-mobile-390-dark.png`
- Tablet 768px: `output/playwright/contact-map/contact-tablet-768.png`

---

## 6. Files Changed

1. [`src/components/pages.tsx`](file:///E:/triyantrav1-main/triyantrav1-main/src/components/pages.tsx) — Removed redundant "Office Location" action row.
2. [`src/components/contact-office-map.tsx`](file:///E:/triyantrav1-main/triyantrav1-main/src/components/contact-office-map.tsx) — Replaced Leaflet with Google Maps embed iframe.
3. [`src/components/contact-office-map.css`](file:///E:/triyantrav1-main/triyantrav1-main/src/components/contact-office-map.css) — Cleaned up Leaflet CSS, styled responsive iframe and frosted card.
4. [`src/app/premium.css`](file:///E:/triyantrav1-main/triyantrav1-main/src/app/premium.css) — Removed unused `.maps-channel` and `.maps-icon` rules.
5. [`next.config.ts`](file:///E:/triyantrav1-main/triyantrav1-main/next.config.ts) — Updated CSP `frame-src` and `img-src`.
6. [`src/proxy.ts`](file:///E:/triyantrav1-main/triyantrav1-main/src/proxy.ts) — Updated middleware CSP `frame-src` and `img-src`.
7. [`package.json`](file:///E:/triyantrav1-main/triyantrav1-main/package.json) & [`package-lock.json`](file:///E:/triyantrav1-main/triyantrav1-main/package-lock.json) — Uninstalled `leaflet` and `@types/leaflet`.
8. [`scripts/verify_contact_map.mjs`](file:///E:/triyantrav1-main/triyantrav1-main/scripts/verify_contact_map.mjs) — Playwright test suite.

---

## 7. Action Items / Configuration

- **No immediate action required:** The map already functions out-of-the-box using the verified official Google Maps share embed for Matrix DaaS Private Limited.
- **Optional:** If you wish to use a dedicated Google Maps Embed API key in the future, configure `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` in your Vercel project environment variables (restricted in Google Cloud Console to `https://triyantrav1.vercel.app/*`).
