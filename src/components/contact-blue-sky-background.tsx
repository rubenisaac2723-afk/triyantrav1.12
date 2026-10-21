"use client";

import React, { memo, useEffect, useRef } from "react";

const POSTER = "/assets/media/contact-blue-sky-poster.webp";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

export const ContactBlueSkyBackground = memo(function ContactBlueSkyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    const constrainedNetwork =
      connection?.saveData === true ||
      /(^|-)2g$/.test(connection?.effectiveType ?? "");

    /* Reduced motion and data-saver both keep the SSR poster: the canvas
       renders the same layout with a static Blue Sky frame instead of motion. */
    if (reducedMotion.matches || constrainedNetwork) {
      container.classList.add("is-static");
      return;
    }

    let inView = false;
    let playTimeout: ReturnType<typeof setTimeout> | undefined;

    const tryPlay = () => {
      if (!inView || document.hidden || reducedMotion.matches) return;
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(
          () => {
            if (!inView || document.hidden || reducedMotion.matches) return;
            video.play().catch(() => {});
          },
          { timeout: 1200 },
        );
      } else {
        playTimeout = setTimeout(() => {
          if (!inView || document.hidden || reducedMotion.matches) return;
          video.play().catch(() => {});
        }, 400);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView = entry.isIntersecting;
          if (inView) {
            tryPlay();
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.01, rootMargin: "300px 0px" },
    );
    observer.observe(container);

    const onReducedMotionChange = () => {
      if (reducedMotion.matches) {
        video.pause();
        container.classList.add("is-static");
      } else {
        container.classList.remove("is-static");
        tryPlay();
      }
    };
    const onVisibilityChange = () => {
      if (document.hidden) video.pause();
      else tryPlay();
    };

    reducedMotion.addEventListener("change", onReducedMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (playTimeout) clearTimeout(playTimeout);
      observer.disconnect();
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      video.pause();
    };
  }, []);

  return (
    <div ref={containerRef} className="contact-cinematic__media" aria-hidden="true">
      {/* Cinematic Blue Sky motion layer. Sources are declared (not switched in
          JS) so the browser tier-picks before paint; preload="none" keeps the
          fetch gated until the section scrolls into view. */}
      <video
        ref={videoRef}
        className="contact-cinematic__video contact-bg-video"
        poster={POSTER}
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        draggable={false}
        onPlaying={(event) => {
          event.currentTarget.classList.add("is-playing");
          event.currentTarget.closest(".contact-cinematic__media")?.classList.add("is-playing");
        }}
      >
        <source
          media="(max-width: 760px)"
          src="/assets/media/contact-blue-sky-mobile.webm"
          type="video/webm"
        />
        <source
          media="(max-width: 760px)"
          src="/assets/media/contact-blue-sky-mobile.mp4"
          type="video/mp4"
        />
        <source
          media="(max-width: 1200px)"
          src="/assets/media/contact-blue-sky-tablet.webm"
          type="video/webm"
        />
        <source
          media="(max-width: 1200px)"
          src="/assets/media/contact-blue-sky-tablet.mp4"
          type="video/mp4"
        />
        <source src="/assets/media/contact-blue-sky-desktop.webm" type="video/webm" />
        <source src="/assets/media/contact-blue-sky-desktop.mp4" type="video/mp4" />
      </video>

      {/* Subtle theme-derived scrim for typography legibility */}
      <div className="contact-cinematic__scrim contact-bg-overlay" />
    </div>
  );
});