# TriYantra — Connected clarity

An original service-led identity: quiet editorial typography, precise product UI, and a continuous requirement-to-device story. The feeling is calm control. The official logo is an unmodified image at its intrinsic aspect ratio, on white in header, footer and the three portal views.

## Source decisions

Read D:\CODEX_PROJECT_MEMORY.pdf, CODEX_PROJECT_BUILD_STANDARDS.md, the complete master brief (including five embedded images), and all three pages of PremiumDashboardDesignGuide.pdf. E:\vibecoding docs.docx is missing. Existing research at design-system/triyantra-v1/MASTER.md is retained; its generic accent, proof badges and bouncing animation recommendations are superseded by this brief-specific system. Reuse public/images/connected-workplace-hero.webp as an illustrative workplace, never as a client photograph.

Research: https://www.apple.com/in/ for restrained chrome and deliberate type hierarchy; https://noodleseed.com/ for useful interactive product storytelling; https://styles.refero.design/ for token documentation and section rhythm. No reference branding, imagery, copy, exact layout or code is reused. Apple-design skill supplies responsive feedback, material fallbacks and typography principles.

## Tokens — final premium glass polish

The September 9 polish brief supersedes the generated palette, font, radius and motion suggestions in design-system/triyantra-v1/MASTER.md. This remains the existing application: routes, approved copy, APIs, lead delivery, SEO, original logo and interactive device experience are preserved.

Brand/action #013068; navy family #00152f / #00234d / #013068 / #0a417f / #185697 / #2d6bb0. Ink #0a0b0c; secondary text rgba(10,11,12,.64); canvas #f5f7fa; paper white. Hairline borders use navy at 8–13% opacity. Labelled operational statuses retain restrained green/amber; these are semantic states, never brand accents.

Native stack: -apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Helvetica Neue, Segoe UI, Arial, sans-serif. No font downloads. Display up to 82px, section headings up to 56px, body 16–18px; portal controls 13px and supporting metadata 12px. Headings 600, controls 500. No invented statistics or testimonials.

Main width 1200px; gutters 32px desktop and 20px mobile. Section rhythm 112px desktop, 80px tablet, 64px mobile. Radii: inputs 12px, cards 20px, feature/form shells 28px, CTA buttons fully rounded. Standard CTAs at least 44px; hero CTAs 52px. Dense record controls keep clear rows and 44px interaction targets.

Glass is selective: 72% white navigation with 24px blur; 90% white dropdowns with 28px blur; 76% white lead/checklist surfaces with 18px blur. Static editorial cards use translucent fill without multiplying blur layers. Navy atmospheric light remains behind content. Solid white fallbacks cover unavailable blur, reduced transparency and increased contrast. White-backed official logo remains byte-for-byte unchanged; footer is #001b3b.

Motion: cubic-bezier(.22,1,.36,1), 160–240ms controls, 200ms menu entrance, 3px arrow feedback, 2px clickable-card lift on hover-capable devices. Reduced motion disables these transitions. Existing on-demand GSAP/Three.js interaction is preserved.

## Components and interactions

Header: official logo, exact primary navigation, native disclosure menus, 64px desktop / 56px mobile glass bar and prominent quote CTA. On mobile, the full-width quote action sits inside the menu. Mobile disclosure reveals the same links; Escape and route changes close menus. Skip link, visible focus and 44px targets throughout.
Buttons: blue primary commercial CTA; glass outlined demo CTA; shared pill controls with 160ms color/shadow feedback and immediate pressed state. No scroll hijacking, auto-playing carousels or ambient looping animations. GSAP provides finite workflow entry and short interaction feedback.
Exactly three reusable portal components share one data definition: Client → Central CRM → Supplier. Desktop grid .9fr 1.3fr .9fr makes CRM centered and dominant; mobile uses the same DOM order in a single column. Each portal provides real module selection and sample row detail. Scenario control changes one connected requirement across the three views. Labels clearly state concept/sample data and roadmap; ₹ only.
Shared hero, breadcrumbs, solution sections, workflow details, final CTA, FAQ disclosures, article layout and lead form use the same tokens. Forms preserve values on failure, show inline errors, pending state, delivery errors and receipt only following a server acknowledgment.

## Responsive/accessibility

Navigation collapses before labels crowd (1100px); portal stack below 1000px; multi-column text collapses at 760px. No decorative content is needed to understand services. Use semantic headings, labels, tables, text statuses and links. Tables scroll inside a labelled region. Reduced motion disables smooth scroll and transform animation; reduced transparency or greater contrast makes glass opaque. Keyboard order follows reading order. 200% zoom and widths 320/375/768/1024/1440 are verification targets.

## Device storytelling and motion update

The homepage uses an asymmetric device-story panel: service explanation on white, product illustration on a cool neutral studio surface. Procure / Rent / Manage controls use an understated baseline indicator. All explanatory copy remains readable during motion. The preserved image is the default view; an explicit button imports the 3D renderer. The native rotation slider responds directly, with no easing lag; changing service gives a 550ms power2.out lid adjustment. No idle animation loop. DPR is capped at 1.5. Context failure restores the image and permits retry.

GSAP matchMedia removes decorative transforms when reduced motion is enabled, including preference changes after mount. Motion code loads when its section enters view. Entry rules use 650ms once-only reveals; scenario feedback is 230ms. All effects are scoped to their component and reverted on unmount. The laptop is an illustrative object, never another dashboard or a promised hardware configuration.

See `SKILLS-REVIEW.md` for the full inventory selection and implementation mapping.

## Light/dark appearance and floating navigation

The September 9 follow-up adds a Noodle Seed-inspired floating pill header while retaining TriYantra's logo, links and navy identity. Light mode keeps the white glass treatment; dark mode uses charcoal/navy surfaces and higher-contrast blue accents across existing pages, controls and forms. The mobile menu uses an opaque surface for readable links above page content.

The 44px theme control follows the system on first visit and remembers an explicit choice in local storage. A nonce-authorized head script applies the theme before paint; blocked storage still permits switching for the visit. The original logo remains on white in either theme.

Native smooth anchor scrolling is retained. Below-the-fold headings and paragraphs reveal once per route visit using IntersectionObserver and Web Animations (20px, 560ms, premium easing). Text starts hidden only after JavaScript initializes and begins appearing 64px inside the viewport. Initial-viewport content, live feedback, functional forms/data, device controls and disclosures are excluded. Content is visible without JavaScript; reduced motion disables reveals and smooth scrolling. Keyboard focus immediately reveals affected link text. No dependencies were added.
