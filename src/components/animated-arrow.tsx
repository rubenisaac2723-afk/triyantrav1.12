"use client";

import React, { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import ctaArrowData from "@/assets/motion/cta-arrow.json";
import downArrowData from "@/assets/motion/down-arrow.json";

export type ArrowDirection = "right" | "up-right" | "down" | "up";
export type ArrowSize = "xs" | "sm" | "md" | "lg";

export interface AnimatedArrowProps {
  direction?: ArrowDirection;
  size?: ArrowSize;
  className?: string;
  trigger?: "parent" | "self" | "manual" | "none";
  showRing?: boolean;
  isOpen?: boolean;
}

const SIZE_MAP: Record<ArrowSize, { width: number; height: number; strokeWidth: number }> = {
  xs: { width: 14, height: 14, strokeWidth: 1.8 },
  sm: { width: 16, height: 16, strokeWidth: 2 },
  md: { width: 18, height: 18, strokeWidth: 2.2 },
  lg: { width: 22, height: 22, strokeWidth: 2.4 },
};

export function AnimatedArrow({
  direction = "up-right",
  size = "md",
  className = "",
  trigger = "parent",
  showRing = false,
  isOpen,
}: AnimatedArrowProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const reducedMotionRef = useRef(false);
  const [isLottieReady, setIsLottieReady] = useState(false);

  const isDownVariant = direction === "down" || direction === "up";
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
      if (e.matches && animRef.current) {
        animRef.current.goToAndStop(0, true);
      }
    };
    mq.addEventListener("change", handleMotionChange);

    let animInstance: AnimationItem | null = null;
    let interactiveParent: HTMLElement | null = null;
    let detailsEl: HTMLDetailsElement | null = null;
    let cleanupListeners: (() => void) | null = null;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const loadLottie = () => {
      if (!isMounted || animRef.current) return;

      import("lottie-web").then((lottieModule) => {
        if (!isMounted || !containerRef.current) return;
        const lottie = lottieModule.default || lottieModule;

        // Clear any previous fallback/content in Lottie container
        const lottieBox = containerRef.current.querySelector<HTMLElement>(".animated-arrow-lottie");
        if (!lottieBox) return;
        lottieBox.innerHTML = "";

        const animData = isDownVariant ? downArrowData : ctaArrowData;

        animInstance = lottie.loadAnimation({
          container: lottieBox,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: animData,
        });

        animRef.current = animInstance;

        animInstance.addEventListener("DOMLoaded", () => {
          if (!isMounted) return;
          animInstance?.goToAndStop(0, true);

          if (isDownVariant) {
            const svgEl = lottieBox.querySelector<SVGSVGElement>("svg");
            if (svgEl) {
              svgEl.setAttribute("viewBox", "26 27 28 28");
            }
          }

          setIsLottieReady(true);
        });

        // Bind interaction triggers if not already playing
        if (trigger === "parent" && interactiveParent) {
          const onMouseEnter = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            animRef.current.goToAndPlay(0, true);
          };

          const onMouseLeave = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            animRef.current.goToAndStop(0, true);
          };

          const onFocusIn = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            requestAnimationFrame(() => {
              if (interactiveParent?.matches(":focus-visible")) {
                animRef.current?.goToAndPlay(0, true);
              }
            });
          };

          const onFocusOut = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            animRef.current.goToAndStop(0, true);
          };

          interactiveParent.addEventListener("mouseenter", onMouseEnter);
          interactiveParent.addEventListener("mouseleave", onMouseLeave);
          interactiveParent.addEventListener("focusin", onFocusIn);
          interactiveParent.addEventListener("focusout", onFocusOut);

          detailsEl = containerRef.current?.closest<HTMLDetailsElement>("details") || null;
          let onToggle: (() => void) | null = null;
          if (detailsEl) {
            onToggle = () => {
              if (reducedMotionRef.current || !animRef.current) return;
              animRef.current.goToAndPlay(0, true);
            };
            detailsEl.addEventListener("toggle", onToggle);
          }

          cleanupListeners = () => {
            interactiveParent?.removeEventListener("mouseenter", onMouseEnter);
            interactiveParent?.removeEventListener("mouseleave", onMouseLeave);
            interactiveParent?.removeEventListener("focusin", onFocusIn);
            interactiveParent?.removeEventListener("focusout", onFocusOut);
            if (detailsEl && onToggle) {
              detailsEl.removeEventListener("toggle", onToggle);
            }
          };
        } else if (trigger === "self") {
          const onSelfEnter = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            animRef.current.goToAndPlay(0, true);
          };
          const onSelfLeave = () => {
            if (reducedMotionRef.current || !animRef.current) return;
            animRef.current.goToAndStop(0, true);
          };
          container.addEventListener("mouseenter", onSelfEnter);
          container.addEventListener("mouseleave", onSelfLeave);

          cleanupListeners = () => {
            container.removeEventListener("mouseenter", onSelfEnter);
            container.removeEventListener("mouseleave", onSelfLeave);
          };
        }
      });
    };

    if (trigger === "parent") {
      interactiveParent = container.closest<HTMLElement>(
        "a, button, summary, [role='button'], details"
      );
    }

    const onUserInteraction = () => {
      loadLottie();
    };

    const targetToWatch = interactiveParent || container;
    targetToWatch.addEventListener("mouseenter", onUserInteraction, { once: true, passive: true });
    targetToWatch.addEventListener("focusin", onUserInteraction, { once: true, passive: true });

    // Schedule idle loading when browser is not busy with initial rendering
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => loadLottie(), { timeout: 3500 });
    } else {
      timerId = setTimeout(() => loadLottie(), 2500);
    }

    return () => {
      isMounted = false;
      mq.removeEventListener("change", handleMotionChange);
      targetToWatch.removeEventListener("mouseenter", onUserInteraction);
      targetToWatch.removeEventListener("focusin", onUserInteraction);
      if (idleId !== undefined && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
      if (cleanupListeners) {
        cleanupListeners();
      }
      if (animInstance) {
        try {
          (animInstance as AnimationItem).destroy();
        } catch {
          // ignore cleanup errors on unmount
        }
      }
      animRef.current = null;
    };
  }, [isDownVariant, trigger]);

  // Controlled disclosure rotation
  const computedDirection = isOpen !== undefined ? (isOpen ? "up" : "down") : direction;

  return (
    <span
      ref={containerRef}
      className={`animated-arrow ${className}`}
      data-direction={computedDirection}
      data-size={size}
      data-ring={showRing ? "true" : "false"}
      data-ready={isLottieReady ? "true" : "false"}
      aria-hidden="true"
    >
      {/* SSR & Initial Static SVG Fallback (Zero hydration shift) */}
      <span className="animated-arrow-fallback" aria-hidden="true">
        {isDownVariant ? (
          <svg
            viewBox="0 0 24 24"
            width={sizeConfig.width}
            height={sizeConfig.height}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width={sizeConfig.width}
            height={sizeConfig.height}
            fill="none"
            stroke="currentColor"
            strokeWidth={sizeConfig.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </span>

      {/* Lottie Animation Canvas Container */}
      <span className="animated-arrow-lottie" aria-hidden="true" />
    </span>
  );
}

export default AnimatedArrow;
