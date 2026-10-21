# TriYantra v1

A service-led B2B workplace technology website, built from the TriYantra Website Makeover Master Brief v2. Project: `C:\Users\samee\triyantrav1`. Local preview: **http://127.0.0.1:3001**.

## Run

Tested with Node 24.20.0 and npm 12. Use Node 24 LTS.

```powershell
cd C:\Users\samee\triyantrav1
npm ci
npm run dev
```

For a production-mode local preview, stop the development server first:

```powershell
npm run build
npm start
```

Both servers use port 3001. If the existing preview is still running, stop it before starting another process on that port.

## Deploy from GitHub to Vercel

Repository: https://github.com/SIDDHUguts/triyantrav1 (private).

1. In Vercel, choose **Add New > Project**, connect GitHub, and grant access to this repository.
2. Import `SIDDHUguts/triyantrav1`, branch `main`.
3. Use framework **Next.js**, root directory **`.`**, Node.js **24.x**, install command **`npm ci`**, and build command **`npm run build`**. Leave the output directory at its framework default. Vercel handles the server; the local `npm start` command is not needed.
4. Deploy for review. Without form credentials, the site displays the honest unavailable state. Leave `NEXT_PUBLIC_SITE_URL` unset for an initial noindex review; metadata uses localhost until it is configured.
5. Once the intended domain is known, set `NEXT_PUBLIC_SITE_URL` to its full HTTPS origin (no trailing slash) in Vercel Environment Variables and redeploy. This also enables indexing, so configure it for public launch only after the launch gates are resolved. Form requests must come from that exact origin.
6. Add `LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_TOKEN`, and `FORM_RECEIPT_SECRET` only after the receiver is authorized. See the integration contract below. Store these values in Vercel, never in GitHub.

The repository includes source, public assets, configuration, and `package-lock.json`. Vercel installs dependencies and generates `.next` and `next-env.d.ts`; do not upload local `node_modules`, build output, research captures, certificates, or `.env.local`. No custom `vercel.json` is needed for this standard Next.js setup.

After deployment, verify routes, assets, mobile navigation, and form failure behavior on the actual host. Verify a real authorized submission before claiming delivery. Review `QA.md` before public launch.

References: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Implemented

- Canonical routes: `/`, `/laptop-desktop-rental`, `/it-device-procurement`, `/device-as-a-service`, `/platform`, `/how-it-works`, `/about`, `/resources`, `/contact`.
- Permanent 308 redirects for consolidated paths: `/book-a-demo` → `/contact`, `/it-asset-management` → `/platform`, `/privacy-policy` → `/privacy`, `/terms-conditions` → `/terms`.
- Signed `/confirmation`, helpful HTTP 404, and recoverable page error boundary.
- All 15 resource topics from the brief, with individual crawlable guides, FAQs, relevant service links, and commercial CTAs. Search, filters and empty-state recovery.
- Exactly three reusable interactive conceptual portals: Client, centered/dominant Central CRM, Supplier. Consistent mobile order; module selection, record inspection and connected workflow scenarios. Sample and roadmap labels throughout.
- Exact quote fields from the brief. Demo request form. Shared browser/server validation, pending/error/acknowledged states, bounded JSON input, origin check, honeypot, basic rate limiting, receiver timeout, idempotency key and signed receipt.
- Unique metadata, canonical URLs, Organization/WebSite/BreadcrumbList structured data, sitemap and robots. No speculative FAQ rich-result eligibility, city pages, legal pages, testimonials, customer logos or performance claims.
- Original design tokens in `DESIGN.md`, responsive layouts, selective navigation glass, reduced-motion/transparency fallbacks, visible focus, skip link and native disclosure menus.

## Installed skills update

See `SKILLS-REVIEW.md` for the full nine-page inventory review and the skills-to-implementation mapping. The homepage now includes an interactive Procure / Rent / Manage story, with GSAP motion and an original Three.js laptop loaded only when requested. The existing three portals share a new animated handoff explanation. All concept labels and form safeguards remain.

Run `npm run test:skills` against the local production preview for the device, keyboard, fallback/retry, reduced-motion and responsive regression. The Three.js module is split out of the initial page load; it renders only on interaction/resize/visibility changes.

## Authorized form integration

**No company destination is configured. The website correctly shows requests as unavailable and never reports delivery.** Successful behavior is verified only against an isolated local HTTPS mock.

Copy `.env.example` to `.env.local` only when the destination and company data handling are approved. Do not copy environment files from older projects.

| Variable               | Purpose                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Approved canonical HTTPS origin, without a trailing slash. Set before building for launch. With no value the review build is noindex and uses localhost in metadata. |
| `LEAD_WEBHOOK_URL`     | Authorized server-side HTTPS receiving endpoint.                                                                                                                     |
| `LEAD_WEBHOOK_TOKEN`   | Server-side bearer credential for that endpoint.                                                                                                                     |
| `FORM_RECEIPT_SECRET`  | At least 32 random characters used for one-hour signed submission receipts.                                                                                          |

The endpoint receives JSON: `kind` (`quote` or `demo`), `requestId` (UUID), `fullName`, `workEmail`, `companyName`, `phone`, `employees`, `devices`, `requirementType`, `deviceType`, `locations`, `startDate`, `message`. Optional values are empty strings. Headers include `Authorization: Bearer …` and `Idempotency-Key: <requestId>`.

The receiver must durably accept the request before returning a 2xx response with `{"accepted":true}`. It must deduplicate retries by the idempotency key, reject unauthorized calls, define data access/retention and provide recovery/backup appropriate to its storage. It has eight seconds to respond. Redirects are rejected. A demo request is a request for a conversation, not an automatically booked appointment.

Unchanged retries retain the same request reference; editing fields starts a new request reference. Fields are locked while a request is pending.

The website stores no lead database. Form values remain in the browser on failure; they are not persisted to localStorage. The one-hour confirmation cookie contains only request kind, timestamp and an HMAC, never form data. Configure a shared hosting-edge rate limit before public/multi-instance launch; the local 30/minute process-wide limiter is only a bounded baseline.

## Analytics hooks

The browser emits `triyantra:analytics` CustomEvents. An approved adapter can subscribe using `window.addEventListener('triyantra:analytics', handler)`.

- `cta_click`: fixed CTA label and pathname.
- `quote_request` / `demo_request`: attempted status.
- `form_completion`: kind and accepted status, only after receiving acknowledgment.

No email, name, company, phone, message or URL query is included. No analytics vendor is connected and no tracking cookies are created. There are no call or WhatsApp events because no approved phone number has been supplied. Confirm data handling requirements before connecting a vendor.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
# With the unconfigured production preview running:
$env:TEST_BASE_URL='http://127.0.0.1:3001'
npm test
npm run test:browser
npm run test:performance
```

Browser scripts use installed Google Chrome; the performance script additionally checks Microsoft Edge. Generated evidence is written under `output/playwright/` and is intentionally not committed. `QA.md` records results and production gates.

To repeat the isolated local HTTPS delivery test, generate disposable certificates (Git for Windows OpenSSL shown), then run:

```powershell
New-Item -ItemType Directory -Force output\playwright | Out-Null
& 'C:\Program Files\Git\usr\bin\openssl.exe' req -x509 -newkey rsa:2048 -keyout output/playwright/test-key.pem -out output/playwright/test-cert.pem -days 2 -nodes -subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
npm run test:delivery
```

This test uses only loopback ports 3002 and 3443, disposable credentials and synthetic records. It never sends to the company. It starts/stops its own processes and does not modify `.env.local` or disable TLS certificate verification.

## Maintain

Git metadata was created by the sandbox account. Git commands in this environment use `git -c safe.directory=C:/Users/samee/triyantrav1 <command>` to trust this inspected repository for that invocation. No global Git trust setting was changed.

- `src/lib/content.ts`: approved service copy, navigation data and page metadata.
- `src/lib/articles.ts`: resource articles.
- `src/components/`: shared presentation and focused interactive components.
- `src/lib/lead.ts`: canonical form fields and validation.
- `src/app/api/leads/route.ts`: delivery boundary; `src/lib/delivery.ts`: receipt signing.
- `src/app/globals.css`: design tokens and responsive styles.
- `src/proxy.ts`: per-request nonce CSP. Pages are server rendered on demand to support fresh nonces; static assets remain cacheable. Inline style attributes are allowed for framework image styles; inline scripts require a nonce. No unsafe-eval in production.

The existing research and workplace image were retained. The official logo is byte-for-byte identical to `C:\Users\samee\triyantra-web\public\assets\brand\triyantra_official_logo.jpg` (1090 × 333), never transformed. The supplied brief's images and PDF renders are kept only in ignored local research output.

## Launch blockers

This is a verified local implementation, **not a deployed or production-ready site**. Resolve the integration, company information, domain, hosting, monitoring, recovery and overnight-QA gates in `QA.md` before launch. The standards reference `E:\vibecoding docs.docx`, which is missing. Source is backed up at `SIDDHUguts/triyantrav1` on GitHub. Vercel is the intended deployment target; no hosted deployment has been verified. Do not invent a redirect map; inventory and approve any legacy URLs before adding redirects or submitting the sitemap to Search Console.
