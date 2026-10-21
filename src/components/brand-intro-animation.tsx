"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TriYantraLogo } from "./brand/triyantra-logo";

gsap.registerPlugin(useGSAP);

const COMPLETE_EVENT = "triyantra:intro-complete";

export function BrandIntroAnimation() {
  const root = useRef<HTMLDivElement>(null);
  const introWrapper = useRef<HTMLDivElement>(null);
  const taglineMaskRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(() => {
    return typeof document !== "undefined" && document.documentElement.dataset.intro !== "play";
  });

  useGSAP(
    (_context, contextSafe) => {
      const overlay = root.current;
      const logoWrapper = introWrapper.current;

      if (
        document.documentElement.dataset.intro !== "play" ||
        !overlay ||
        !logoWrapper ||
        !contextSafe
      ) {
        if (overlay) {
          overlay.style.display = "none";
          overlay.classList.add("is-finished");
        }
        setDone(true);
        return;
      }

      overlay.dataset.hydrated = "true";

      const navLogoTarget = document.getElementById("navbar-brand-logo");
      const previousDocOverflow = document.documentElement.style.overflow;
      const previousBodyOverflow = document.body.style.overflow;
      let closing = false;

      // Lock page scroll during intro
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (navLogoTarget) {
        gsap.set(navLogoTarget, { opacity: 0 });
      }

      const restorePage = () => {
        document.documentElement.style.overflow = previousDocOverflow;
        document.body.style.overflow = previousBodyOverflow;
        if (navLogoTarget) {
          gsap.set(navLogoTarget, { opacity: 1 });
        }
      };

      const finish = contextSafe(() => {
        if (closing) return;
        closing = true;

        if (overlay) {
          overlay.style.display = "none";
          overlay.style.opacity = "0";
          overlay.style.visibility = "hidden";
          overlay.classList.add("is-finished");
        }
        if (logoWrapper) {
          logoWrapper.style.display = "none";
          logoWrapper.style.opacity = "0";
        }

        restorePage();
        document.documentElement.dataset.intro = "skip";
        window.dispatchEvent(new Event(COMPLETE_EVENT));
        setDone(true);
      });

      const fallbackTimer = setTimeout(() => {
        finish();
      }, 1800);

      const onKeyDown = contextSafe((event: KeyboardEvent) => {
        if (event.key === "Escape") {
          finish();
        }
      });

      window.addEventListener("keydown", onKeyDown);

      const isCompact = typeof window !== "undefined" && window.innerWidth <= 1024;
      const mainTl = gsap.timeline();

      // 1. Initial vector logo reveal in center
      mainTl.fromTo(
        logoWrapper,
        { opacity: 0, scale: 0.85, filter: "blur(8px)", y: 16 },
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        },
      );

      // 2. Intentional brief hold
      mainTl.to({}, { duration: 0.2 });

      // 3. Tagline behavior: On mobile and tablet, fade out tagline before flight
      if (isCompact && taglineMaskRef.current) {
        mainTl.to(taglineMaskRef.current, {
          opacity: 1,
          duration: 0.2,
          ease: "power2.out",
        });
      }

      // 4. Coordinate crisp flight into navbar target
      mainTl.add(() => {
        if (!navLogoTarget) {
          finish();
          return;
        }

        const startRect = logoWrapper.getBoundingClientRect();
        const endRect = navLogoTarget.getBoundingClientRect();

        const scale =
          startRect.width > 0 ? endRect.width / startRect.width : 0.5;
        const deltaX =
          endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
        const deltaY =
          endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);

        const flightTl = gsap.timeline({
          onComplete: () => {
            finish();
          },
        });

        flightTl.to(logoWrapper, {
          x: deltaX,
          y: deltaY,
          scale: scale,
          duration: 0.55,
          ease: "power3.inOut",
        });

        flightTl.to(
          overlay,
          {
            opacity: 0,
            duration: 0.35,
            ease: "power2.inOut",
            onComplete: () => {
              if (navLogoTarget) {
                gsap.set(navLogoTarget, { opacity: 1 });
              }
              gsap.set(logoWrapper, { opacity: 0 });
            },
          },
          "-=0.25",
        );
      });

      return () => {
        clearTimeout(fallbackTimer);
        window.removeEventListener("keydown", onKeyDown);
        restorePage();
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div
      className="brand-intro"
      ref={root}
      data-media="ready"
      aria-hidden="true"
    >
      <div className="brand-intro__content">
        <div
          ref={introWrapper}
          className="brand-intro-logo-box"
          style={{
            width: "min(90vw, 520px)",
            position: "relative",
            willChange: "transform, opacity, filter",
          }}
        >
          <TriYantraLogo priority />
          <div
            ref={taglineMaskRef}
            className="brand-intro-tagline-mask"
            style={{
              position: "absolute",
              top: "66%",
              left: "32%",
              width: "60%",
              height: "8.5%",
              background: "#ffffff",
              opacity: 0,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
