<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TriYantra V1.2 Project & Engineering Rules

## 1. Stack & Architecture
- **Framework:** Next.js 16.3.4 (App Router, Turbopack)
- **UI Runtime:** React 19.2.8
- **Language:** TypeScript 6.0 (Strict mode, zero `any` policy)
- **Styling:** Custom CSS design system (`globals.css`, `premium.css`, modular component CSS).
- **Animation:** GSAP 3.15 + Lenis 1.3 (respects `prefers-reduced-motion: reduce`).
- **Principles:** Simple > clever, server-rendered content first, client components only for interactive surfaces, zero hydration mismatches, zero FOUC.

---

## 2. Theme & Appearance System
- **3-State Model:**
  - `ThemePreference = "system" | "light" | "dark"`
  - `ResolvedTheme = "light" | "dark"`
  - Separation between user preference and DOM resolved state is strictly required.
- **Default Mode:** `"system"`. Automatically follows OS/browser preference (`prefers-color-scheme`).
- **Live Reactivity:** In `"system"` mode, a native `MediaQueryList` change listener tracks OS shifts in real time without polling, intervals, or page reloads. Proper listener cleanup is mandatory.
- **Persistence:** Explicit choice saved in `localStorage["triyantra-theme"]` (`"system"`, `"light"`, or `"dark"`).
- **FOUC Prevention:** Synchronous inline `<script>` in `<head>` (secured with CSP `nonce`) inspects `localStorage` and `matchMedia` to stamp `data-theme`, `data-theme-preference`, and `style.colorScheme` onto `<html>` prior to paint.
- **Hydration Safety:** React 19 theme state is synchronized using `useSyncExternalStore` (avoid manual `useState`/`useEffect` sets that trigger cascading render warnings).
- **Authoritative Root:** Only `document.documentElement` (`data-theme`) holds the root visual state.

---

## 3. Navbar & Navigation Design
- **Capsule Silhouette:** Floating rounded glass capsule with `--radius-nav: 32px`, centered and inset (never full-bleed rectangular).
- **RGB Border Effect:** Interactive RGB glow layer preserved across top-of-page, scrolled, and hover/focus states.
- **Mobile/Tablet Viewports (`≤ 1100px`):**
  - Standalone circular theme toggle button is REMOVED from the navbar (`display: none !important`).
  - Mobile header capsule is cleanly balanced: `[ TRIYANTRA logo ]` (flex-start) and `[ ☰ Menu ]` (`margin-left: auto`), maintaining 16px edge padding.
- **Appearance In-Menu:**
  - Appearance controls live inside `<dialog id="mobile-navigation">` above the quote button.
  - 3-state segmented control (`System` / `Light` / `Dark`) using WAI-ARIA `role="radiogroup"` and `role="radio"`.
  - Arrow key navigation (Left/Right/Up/Down) with roving `tabIndex`.
  - Tapping an appearance option changes the theme immediately while leaving the navigation dialog open for seamless user feedback.
- **Desktop Viewports (`> 1100px`):** Retains full navigation bar, quote CTA, and direct desktop theme toggle.

---

## 4. Responsive Layout & Geometry Guidelines
- **Zero Horizontal Overflow:** All pages and components must guarantee 0px horizontal overflow across all viewports (360px–1920px).
- **Interactive Product Story Window Header (`.stage-window-head`):**
  - Base (Desktop/Tablet): `gap: 12px`, with `flex-shrink: 0` on dots and live indicator, and `white-space: nowrap` on badges to prevent text breakage.
  - Mobile (`≤ 640px`): 2-row CSS Grid layout:
    - Row 1: Window dots (`• • •`) aligned left, `● SAMPLE DATA` aligned right with ~150px–220px open breathing room.
    - Row 2: Stage badge centered (`justify-self: center; margin-inline: auto;`) as a clean single-line capsule pill.
- **Media Surfaces:** Hero and Contact product motion videos must render with `background: var(--surface); border: 0;` (no black borders or postcard frames).

---

## 5. Engineering Quality Gates
Before reporting or shipping any change:
1. `npm run typecheck` must pass (0 errors).
2. `npx eslint src/` / `npm run lint` must pass (0 errors).
3. `npm run test` must pass.
4. `npm run build` must succeed without warnings or errors.
5. Automated Playwright checks must confirm 0 console errors and 0 hydration mismatches.

---

## 6. Workplace Essentials / Interactive Illustration
- **Media Presentation:** High-definition responsive poster image (`/images/connected-workplace-hero.webp`) with balanced, intentional vertical spacing (`margin: var(--space-4) var(--space-6) var(--space-4)`).
- **Clean Component Scope:** Interactive illustration card focuses cleanly on Workplace Essentials (Procure, Rent, Manage chapters) with supporting copy and disclaimer; extraneous "Explore in 3D" button and rotation controls are removed.

