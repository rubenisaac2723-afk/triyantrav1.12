"use client";
import { useEffect } from "react";
export function track(event: string, detail: Record<string, string> = {}) {
  window.dispatchEvent(
    new CustomEvent("triyantra:analytics", { detail: { event, ...detail } }),
  );
}
export function Analytics() {
  useEffect(() => {
    function click(e: MouseEvent) {
      const link = (e.target as Element).closest<HTMLElement>("[data-cta]");
      if (link)
        track("cta_click", {
          label: link.dataset.cta || "CTA",
          path: location.pathname,
        });
    }
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
