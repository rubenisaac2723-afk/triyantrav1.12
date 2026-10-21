"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "triyantra-theme";

export function setThemePreference() {
  /* Light theme is final per client approval. */
}

export function useTheme() {
  return {
    preference: "light" as const,
    resolvedTheme: "light" as const,
    isDark: false,
    setPreference: () => {},
  };
}

export function ThemeToggle() {
  return null;
}

export function AppearanceSection() {
  return null;
}

export function ScrollReveal() {
  const path = usePathname();
  const previousPath = useRef(path);
  const veil = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia(
      "(min-width: 1101px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    let dispose: (() => void) | undefined;
    let generation = 0;
    const setup = () => {
      const current = ++generation;
      dispose?.();
      dispose = undefined;
      if (
        !media.matches ||
        connection?.saveData ||
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ??
          8) < 4
      )
        return;
      import("./scroll-engine")
        .then(({ startScrollEngine }) => {
          if (current === generation) dispose = startScrollEngine();
        })
        .catch(() => {
          /* Native scroll remains available if the optional chunk fails. */
        });
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      generation++;
      dispose?.();
      media.removeEventListener("change", setup);
    };
  }, []);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let routeTimer: ReturnType<typeof setTimeout> | undefined;
    const prepared = new Set<HTMLElement>();
    const reveal = (element: HTMLElement) => {
      element.classList.add("reveal-visible");
      observer?.unobserve(element);
    };
    const showFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target;
      prepared.forEach((element) => {
        if (element.contains(target) || target.contains(element))
          reveal(element);
      });
    };
    const setup = () => {
      observer?.disconnect();
      prepared.forEach((element) =>
        element.classList.remove(
          "reveal-pending",
          "reveal-visible",
          "reveal-text",
          "reveal-media",
          "reveal-card",
          "reveal-quiet",
        ),
      );
      prepared.clear();
      if (reduced.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            reveal(entry.target as HTMLElement);
          });
        },
        { rootMargin: "0px 0px -40px 0px" },
      );
      document
        .querySelectorAll<HTMLElement>(
          "[data-reveal], .page-hero > .eyebrow, .page-hero > .lead, .page-hero > .actions, .hero-heading > .eyebrow, .hero-promise, .hero-heading > .actions, .device-stage, .mission-grid article, .point-list article",
        )
        .forEach((element) => {
          if (element.closest(".article-body, form, .sr-only")) return;
          const type =
            element.dataset.reveal ||
            (element.matches(".device-stage") ? "media" : "quiet");
          element.classList.add("reveal-pending", `reveal-${type}`);
          prepared.add(element);
          const aboveFold = element.getBoundingClientRect().top < innerHeight;
          if (aboveFold) requestAnimationFrame(() => reveal(element));
          else observer?.observe(element);
        });
      if (previousPath.current !== path && veil.current) {
        veil.current.classList.remove("route-veil-active");
        void veil.current.offsetWidth;
        veil.current.classList.add("route-veil-active");
        clearTimeout(routeTimer);
        routeTimer = setTimeout(
          () => veil.current?.classList.remove("route-veil-active"),
          700,
        );
      }
      previousPath.current = path;
    };
    setup();
    reduced.addEventListener("change", setup);
    document.addEventListener("focusin", showFocused);
    return () => {
      observer?.disconnect();
      prepared.forEach((element) =>
        element.classList.remove(
          "reveal-pending",
          "reveal-visible",
          "reveal-text",
          "reveal-media",
          "reveal-card",
          "reveal-quiet",
        ),
      );
      prepared.clear();
      clearTimeout(routeTimer);
      reduced.removeEventListener("change", setup);
      document.removeEventListener("focusin", showFocused);
    };
  }, [path]);
  return <div className="route-veil" ref={veil} aria-hidden="true" />;
}
