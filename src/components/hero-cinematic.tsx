"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { Arrow } from "./shared";

gsap.registerPlugin(useGSAP);

export function HeroCinematic() {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const rollTrackRef = useRef<HTMLSpanElement>(null);
  const rollTimelineRef = useRef<gsap.core.Timeline | null>(null);

  // Video playback lifecycle, Tab Visibility, and IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => {
      if (reduced.matches) {
        video.pause();
        video.removeAttribute("autoplay");
      }
    };
    syncReduced();
    reduced.addEventListener("change", syncReduced);
    let isHeroVisible = true;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (reduced.matches) {
            video.pause();
            continue;
          }
          if (entry.isIntersecting) {
            isHeroVisible = true;
            video.play().catch(() => {});
            if (!document.hidden && rollTimelineRef.current?.paused()) {
              rollTimelineRef.current.resume();
            }
          } else {
            isHeroVisible = false;
            video.pause();
            rollTimelineRef.current?.pause();
          }
        }
      },
      { threshold: 0.1 },
    );

    if (rootRef.current) {
      observer.observe(rootRef.current);
    }

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
        rollTimelineRef.current?.pause();
      } else if (isHeroVisible && !reduced.matches) {
        video.play().catch(() => {});
        if (rollTimelineRef.current?.paused()) {
          rollTimelineRef.current.resume();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reduced.removeEventListener("change", syncReduced);
    };
  }, []);

  // Entrance and continuous 4-state kinetic word-roll animation
  useGSAP(
    () => {
      let hasEntered = false;
      let safetyTimer: ReturnType<typeof setTimeout> | null = null;
      let onIntroComplete: (() => void) | null = null;

      const track = rollTrackRef.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Build continuous kinetic word roll timeline (CONNECTED. -> MANAGED. -> VISIBLE. -> SIMPLIFIED. -> repeat)
      if (track && !reduced) {
        const HOLD = 1.35;
        const ROLL = 0.55;
        const EASE = "power3.inOut";

        // 5 items: 0% = CONNECTED., -20% = MANAGED., -40% = VISIBLE., -60% = SIMPLIFIED., -80% = CONNECTED. (clone)
        const rollTl = gsap.timeline({
          repeat: -1,
          paused: true,
        });
        rollTimelineRef.current = rollTl;

        rollTl
          .to(track, {
            yPercent: -20,
            duration: ROLL,
            ease: EASE,
            delay: HOLD,
          })
          .to(track, {
            yPercent: -40,
            duration: ROLL,
            ease: EASE,
            delay: HOLD,
          })
          .to(track, {
            yPercent: -60,
            duration: ROLL,
            ease: EASE,
            delay: HOLD,
          })
          .to(track, {
            yPercent: -80,
            duration: ROLL,
            ease: EASE,
            delay: HOLD,
          })
          .set(track, { yPercent: 0 });
      }

      const revealHero = () => {
        if (hasEntered || !rootRef.current) return;
        hasEntered = true;

        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }

        // Clean up any lingering intro overlay
        const lingeringIntro = document.querySelector<HTMLElement>(".brand-intro");
        if (lingeringIntro) {
          lingeringIntro.style.display = "none";
          lingeringIntro.classList.add("is-finished");
        }

        const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pillTarget = rootRef.current.querySelector<HTMLElement>(".hero-badge-pill");
        const staticTarget = rootRef.current.querySelector<HTMLElement>(".hero-word-static");
        const mottoTarget = rootRef.current.querySelector<HTMLElement>(".hero-motto");
        const actionsTarget = rootRef.current.querySelector<HTMLElement>(".hero-actions-group");
        const demoTarget = rootRef.current.querySelector<HTMLElement>(".hero-demo-stage");
        const rollTrack = rollTrackRef.current;

        const targets = [pillTarget, staticTarget, mottoTarget, actionsTarget, demoTarget].filter(
          (el): el is HTMLElement => Boolean(el),
        );

        if (isReduced) {
          if (targets.length) gsap.set(targets, { y: 0, opacity: 1 });
          if (rollTrack) {
            // Park permanently on SIMPLIFIED. (-60%) in reduced motion
            gsap.set(rollTrack, { yPercent: -60, opacity: 1 });
          }
          return;
        }
        if (targets.length) {
          targets.forEach((t, i) => {
            t.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s`;
            t.style.opacity = "1";
            t.style.transform = "translateY(0px)";
          });
        }

        if (rollTrack) {
          rollTrack.style.transition = "opacity 0.5s ease-out 0.2s";
          rollTrack.style.opacity = "1";
          setTimeout(() => {
            if (!document.hidden) {
              rollTimelineRef.current?.play();
            }
          }, 300);
        }

        setTimeout(() => {
          targets.forEach((t) => {
            t.style.transition = "";
            t.style.transform = "";
          });
          if (rollTrack) {
            rollTrack.style.transition = "";
          }
        }, 1000);
      };

      if (
        typeof document !== "undefined" &&
        document.documentElement.dataset.intro === "play"
      ) {
        const pillTarget = rootRef.current?.querySelector<HTMLElement>(".hero-badge-pill");
        const staticTarget = rootRef.current?.querySelector<HTMLElement>(".hero-word-static");
        const mottoTarget = rootRef.current?.querySelector<HTMLElement>(".hero-motto");
        const actionsTarget = rootRef.current?.querySelector<HTMLElement>(".hero-actions-group");
        const demoTarget = rootRef.current?.querySelector<HTMLElement>(".hero-demo-stage");
        const rollTrack = rollTrackRef.current;

        const targets = [pillTarget, staticTarget, mottoTarget, actionsTarget, demoTarget].filter(
          (el): el is HTMLElement => Boolean(el),
        );

        if (targets.length) {
          targets.forEach((t) => {
            t.style.opacity = "0";
            t.style.transform = "translateY(20px)";
          });
        }
        if (rollTrack) {
          rollTrack.style.opacity = "0";
        }

        onIntroComplete = () => {
          revealHero();
        };
        window.addEventListener("triyantra:intro-complete", onIntroComplete, { once: true });

        // Safety fallback: ensure hero content is never left hidden if event is delayed/missed
        safetyTimer = setTimeout(() => {
          revealHero();
        }, 1800);
      } else {
        revealHero();
      }

      return () => {
        if (safetyTimer) {
          clearTimeout(safetyTimer);
        }
        if (onIntroComplete) {
          window.removeEventListener("triyantra:intro-complete", onIntroComplete);
        }
        rollTimelineRef.current?.kill();
        rollTimelineRef.current = null;
      };
    },
    { scope: rootRef },
  );

  return (
    <section className="home-hero" ref={rootRef}>
      <div className="hero-canvas">
        <div className="hero-ambient-glow" aria-hidden="true" />

        <div className="hero-heading">
          {/* CleanShot-style Announcement Pill Badge */}
          <div className="hero-badge-pill" aria-label="Announcement">
            <span className="hero-badge-dot" aria-hidden="true" />
            <span className="hero-badge-text">
              Let’s power your growth with affordable, flexible, and reliable devices.
            </span>
          </div>

          <h1 className="hero-kinetic-title" ref={titleRef}>
            {/* Accessible, SEO-canonical headline for search engines & screen readers */}
            <span className="sr-only">Workplace Technology Simplified.</span>

            {/* Line 1: Workplace Technology */}
            <span className="hero-kinetic-line hero-line-primary" aria-hidden="true">
              <span className="hero-word-static">Workplace Technology</span>
            </span>

            {/* Line 2: Continuous four-state kinetic word roll */}
            <span className="hero-kinetic-line hero-line-secondary" aria-hidden="true">
              <span className="hero-roll-viewport">
                <span className="hero-roll-track" ref={rollTrackRef}>
                  <span className="hero-roll-word">CONNECTED.</span>
                  <span className="hero-roll-word">MANAGED.</span>
                  <span className="hero-roll-word">VISIBLE.</span>
                  <span className="hero-roll-word">SIMPLIFIED.</span>
                  <span className="hero-roll-word">CONNECTED.</span>
                </span>
              </span>
            </span>
          </h1>

          <p className="hero-motto">
            Enterprise hardware on your terms. From first deployment to end of lifecycle.
          </p>

          <div className="hero-actions-group">
            <div className="hero-actions-row">
              <Link
                className="button primary hero-primary-cta"
                href="/contact"
                data-rgb
                data-cta="Get a Quote"
              >
                Get a Quote <Arrow direction="right" />
              </Link>
              <Link
                className="button secondary hero-secondary-cta"
                href="/platform"
                data-cta="Explore Platform"
              >
                Explore Platform
              </Link>
            </div>

            <div className="hero-reassurance-note">
              <svg
                className="hero-check-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Predictable rental &amp; DaaS fleet plans</span>
            </div>
          </div>
        </div>

        {/* Product Demo Area (Immediately Below CTA - CleanShot inspired) */}
        <div className="hero-demo-stage">
          <div className="product-motion hero-demo-card">
            <div className="product-motion-frame">
              <video
                ref={videoRef}
                className="product-motion-video hero-bg-video"
                poster="/assets/media/triyantra-product-motion-poster.jpg"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                width={1920}
                height={1080}
                aria-hidden="true"
                tabIndex={-1}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                draggable={false}
              >
                <source
                  media="(max-width: 760px)"
                  src="/assets/media/triyantra-product-motion-mobile.mp4"
                  type="video/mp4"
                />
                <source
                  media="(max-width: 760px)"
                  src="/assets/media/triyantra-product-motion-mobile.webm"
                  type="video/webm"
                />
                <source
                  src="/assets/media/triyantra-product-motion.webm"
                  type="video/webm"
                />
                <source
                  src="/assets/media/triyantra-product-motion.mp4"
                  type="video/mp4"
                />
              </video>

              <div className="hero-demo-controls">
                <span className="hero-demo-pill-badge" aria-hidden="true">
                  One connected ecosystem
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
