"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { services } from "@/lib/content";
import { useRGBInteraction } from "./rgb-interaction";
import { Logo } from "./shared";
import { AnimatedArrow } from "./animated-arrow";
export function Header() {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  useRGBInteraction(ref);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  function closeMenus() {
    dialog.current?.close();
    setMobileOpen(false);
    setDropdownOpen(false);
    ref.current
      ?.querySelectorAll("details[open]")
      .forEach((el) => el.removeAttribute("open"));
  }
  useEffect(() => {
    dialog.current?.close();
    ref.current
      ?.querySelectorAll("details[open]")
      .forEach((el) => el.removeAttribute("open"));
  }, [path]);
  useEffect(() => {
    if (!mobileOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = html.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    const media = matchMedia("(min-width: 1101px)");
    const resize = () => {
      if (media.matches) closeMenus();
    };
    media.addEventListener("change", resize);
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevOverscroll;
      media.removeEventListener("change", resize);
    };
  }, [mobileOpen]);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) closeMenus();
    }
    const header = ref.current;
    const toggled = () =>
      setDropdownOpen(!!header?.querySelector(".desktop-nav details[open]"));
    header?.addEventListener("toggle", toggled, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      header?.removeEventListener("toggle", toggled, true);
    };
  }, []);
  const active = (href: string) =>
    path === href ? ("page" as const) : undefined;
  return (
    <>
      {dropdownOpen && <div className="nav-shade" aria-hidden="true" />}
      <header
        ref={ref}
        className="site-header"
        data-compact="false"
        data-direction="up"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            closeMenus();
        }}
        onClick={(e) => {
          if ((e.target as Element).closest("a")) closeMenus();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            const open = ref.current?.querySelector("details[open]");
            closeMenus();
            (open?.querySelector("summary") as HTMLElement)?.focus();
          }
        }}
      >
        <div className="nav-wrap">
          <Link
            href="/"
            aria-label="TriYantra home"
            className="header-logo"
            id="navbar-brand-logo"
          >
            <Logo priority />
          </Link>
          <div className="mobile-menu">
            <button
              ref={trigger}
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                dialog.current?.showModal();
                setMobileOpen(true);
              }}
            >
              <span className="menu-bars" />
              Menu
            </button>
            <dialog
              ref={dialog}
              id="mobile-navigation"
              className="mobile-dialog"
              aria-label="Navigation"
              data-lenis-prevent
              onClose={() => {
                setMobileOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeMenus();
              }}
            >
              <div className="mobile-dialog-head">
                <span>TriYantra / Navigation</span>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={closeMenus}
                >
                  {"\u00d7"}
                </button>
              </div>
              <nav aria-label="Mobile navigation">
                <Link href="/" aria-current={active("/")}>
                  Home
                </Link>
                <span>Solutions</span>
                {services.map((s) => (
                  <Link
                    key={s.slug}
                    href={"/" + s.slug}
                    aria-current={active("/" + s.slug)}
                  >
                    {s.label}
                  </Link>
                ))}
                {[
                  ["Platform", "/platform"],
                  ["How It Works", "/how-it-works"],
                  ["Resources", "/resources"],
                  ["About", "/about"],
                  ["Contact", "/contact"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} aria-current={active(href)}>
                    {label}
                  </Link>
                ))}
                <Link
                  className="button primary mobile-quote"
                  href="/contact"
                  data-rgb
                  data-cta="Mobile quote"
                >
                  Get a Quote <AnimatedArrow direction="up-right" size="sm" />
                </Link>
              </nav>
            </dialog>
          </div>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/" aria-current={active("/")}>
              Home
            </Link>
            <details
              name="desktop-navigation"
              data-active={services.some((s) => path === "/" + s.slug)}
            >
              <summary>
                Solutions <AnimatedArrow direction="down" size="xs" />
              </summary>
              <div className="dropdown solutions-menu">
                <p className="eyebrow">Workplace technology</p>
                {services.map((s) => (
                  <Link key={s.slug} href={"/" + s.slug}>
                    {s.label}
                    <AnimatedArrow direction="right" size="sm" />
                  </Link>
                ))}
              </div>
            </details>
            <details
              name="desktop-navigation"
              data-active={path === "/platform"}
            >
              <summary>
                Platform <AnimatedArrow direction="down" size="xs" />
              </summary>
              <div className="dropdown">
                {[
                  ["Overview", "/platform"],
                  ["Client View", "/platform#client"],
                  ["Supplier View", "/platform#supplier"],
                  ["Central CRM / Ecosystem", "/platform#central"],
                ].map(([l, h]) => (
                  <Link key={h} href={h} onClick={closeMenus}>
                    {l}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/how-it-works" aria-current={active("/how-it-works")}>
              How It Works
            </Link>
            <details
              name="desktop-navigation"
              data-active={path.startsWith("/resources")}
            >
              <summary>
                Resources <AnimatedArrow direction="down" size="xs" />
              </summary>
              <div className="dropdown">
                {[
                  "Blog",
                  "Guides",
                  "FAQs",
                  "Device Guides",
                  "IT Procurement Insights",
                ].map((l) => (
                  <Link
                    key={l}
                    href={"/resources#" + l.toLowerCase().replaceAll(" ", "-")}
                    onClick={closeMenus}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </details>
            <Link href="/about" aria-current={active("/about")}>
              About
            </Link>
            <Link href="/contact" aria-current={active("/contact")}>
              Contact
            </Link>
          </nav>
          <Link
            href="/contact"
            className="button primary nav-quote"
            data-rgb
            data-cta="Header quote"
          >
            Get a Quote <AnimatedArrow direction="up-right" size="sm" />
          </Link>
        </div>
      </header>
    </>
  );
}
