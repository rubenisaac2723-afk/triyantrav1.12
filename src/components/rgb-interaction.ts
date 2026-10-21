"use client";
import { useEffect, type RefObject } from "react";

// ONE shared, delegated TriYantra RGB pointer system.
// A single document-level pointermove listener feeds one requestAnimationFrame,
// which writes CSS custom properties onto whichever host the cursor is over —
// the floating header, a [data-rgb] control, or a [data-spotlight] tile.
// No per-host listeners and no React state in the pointer path: the only DOM
// work per move is a couple of style.setProperty calls that composite for free.
// F3 keeps its contract (host variables on .site-header, data-nav-pressed
// bloom, reduced-motion and non-mouse pointers never light up).

const HOST_SELECTOR = ".site-header, [data-rgb], [data-spotlight]";

let engine: (() => void) | null = null;
let engineUsers = 0;

function acquireEngine() {
  engineUsers += 1;
  if (!engine) engine = startRGBEngine();
  return () => {
    engineUsers -= 1;
    if (engineUsers === 0 && engine) {
      engine();
      engine = null;
    }
  };
}

export function useRGBInteraction(
  _ref?: RefObject<HTMLElement | null>,
  _selector?: string,
) {
  void _ref;
  void _selector;
  useEffect(() => acquireEngine(), []);
}

function startRGBEngine() {
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let activeHost: HTMLElement | null = null;
  let frame = 0;
  let pending: { x: number; y: number; target: EventTarget | null } | null =
    null;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;

  const usable = (event: PointerEvent) =>
    event.pointerType === "mouse" && finePointer.matches && !reduced.matches;

  const clearPressed = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = undefined;
    }
    activeHost?.removeAttribute("data-nav-pressed");
  };

  const clearHost = (host: HTMLElement | null) => {
    if (!host) return;
    host.style.setProperty("--nav-glow-opacity", "0");
    if (host.hasAttribute("data-nav-pressed")) host.removeAttribute("data-nav-pressed");
  };

  const apply = () => {
    frame = 0;
    const pointer = pending;
    pending = null;
    if (!pointer) return;
    const host =
      pointer.target instanceof Element
        ? pointer.target.closest<HTMLElement>(HOST_SELECTOR)
        : null;
    if (host !== activeHost) {
      clearHost(activeHost);
      activeHost = host;
    }
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const x = pointer.x - rect.left;
    const y = pointer.y - rect.top;
    host.style.setProperty("--pointer-x", `${x}px`);
    host.style.setProperty("--pointer-y", `${y}px`);
    host.style.setProperty(
      "--pointer-angle",
      `${(Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180) / Math.PI}deg`,
    );
    host.style.setProperty("--nav-glow-opacity", "1");
  };

  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !finePointer.matches || reduced.matches) {
      clearHost(activeHost);
      activeHost = null;
      pending = null;
      return;
    }
    pending = { x: event.clientX, y: event.clientY, target: event.target };
    if (!frame) frame = requestAnimationFrame(apply);
  };

  const down = (event: PointerEvent) => {
    if (!usable(event) || !activeHost) return;
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = undefined;
    }
    activeHost.setAttribute("data-nav-pressed", "true");
    pressTimer = setTimeout(() => activeHost?.removeAttribute("data-nav-pressed"), 200);
  };

  const up = () => clearPressed();

  const leave = () => {
    clearPressed();
    clearHost(activeHost);
    activeHost = null;
    pending = null;
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const out = (event: PointerEvent) => {
    if (!event.relatedTarget) leave();
  };

  const onChange = () => {
    if (!finePointer.matches || reduced.matches) leave();
  };

  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerdown", down, { passive: true });
  document.addEventListener("pointerup", up, { passive: true });
  document.addEventListener("pointercancel", leave);
  document.addEventListener("pointerout", out);
  document.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  finePointer.addEventListener("change", onChange);
  reduced.addEventListener("change", onChange);

  return () => {
    leave();
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerdown", down);
    document.removeEventListener("pointerup", up);
    document.removeEventListener("pointercancel", leave);
    document.removeEventListener("pointerout", out);
    document.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
    finePointer.removeEventListener("change", onChange);
    reduced.removeEventListener("change", onChange);
  };
}