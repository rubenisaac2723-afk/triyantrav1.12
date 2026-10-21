"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Jitter UI Motion Placement 1: Product Story phase transition micro-indicator
 */
export function ProductStoryPhaseMotion({
  activeStep,
}: {
  activeStep: number;
}) {
  const reduced = useReducedMotion();

  return (
    <div
      className="product-story-phase-motion"
      aria-hidden="true"
      data-step={activeStep}
    >
      <div className="phase-track">
        <span
          className="phase-indicator-beam"
          style={{
            transform: `translateX(${activeStep * 100}%)`,
            transition: reduced
              ? "none"
              : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <span className={`phase-node ${activeStep === 0 ? "active" : ""}`}>
          01
        </span>
        <span className={`phase-node ${activeStep === 1 ? "active" : ""}`}>
          02
        </span>
        <span className={`phase-node ${activeStep === 2 ? "active" : ""}`}>
          03
        </span>
      </div>
    </div>
  );
}

/**
 * Jitter UI Motion Placement 2: Platform dashboard portal orchestration transition
 */
export function PortalStateMotion({ scenario }: { scenario: number }) {
  const reduced = useReducedMotion();

  return (
    <div
      className="portal-state-motion"
      aria-hidden="true"
      data-scenario={scenario}
    >
      <div className="portal-orchestration-nodes">
        <span className={`portal-node ${scenario >= 0 ? "is-connected" : ""}`}>
          <span className="node-dot" />
          <span className="node-label">Client</span>
        </span>
        <span className="orchestration-connector">
          <span
            className="connector-pulse"
            style={{
              animation: reduced
                ? "none"
                : "pulseTravel 2s ease-in-out infinite",
            }}
          />
        </span>
        <span className={`portal-node ${scenario >= 0 ? "is-connected" : ""}`}>
          <span className="node-dot" />
          <span className="node-label">TriYantra</span>
        </span>
        <span className="orchestration-connector">
          <span
            className="connector-pulse"
            style={{
              animation: reduced
                ? "none"
                : "pulseTravel 2s ease-in-out infinite 0.6s",
            }}
          />
        </span>
        <span className={`portal-node ${scenario >= 1 ? "is-connected" : ""}`}>
          <span className="node-dot" />
          <span className="node-label">Supplier</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Jitter UI Motion Placement 3: Form submission success confirmation checkmark
 */
export function FormSuccessMotion() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (reduced || hasPlayed) return;
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      /* Fallback to static checkmark */
    });
  }, [reduced, hasPlayed]);

  if (reduced) {
    return <span className="confirmation-symbol-static">✓</span>;
  }

  return (
    <div className="form-success-motion-wrapper" aria-hidden="true">
      <video
        ref={videoRef}
        className="form-success-motion-video"
        muted
        playsInline
        tabIndex={-1}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        draggable={false}
        onEnded={() => setHasPlayed(true)}
      >
        <source
          src="/assets/motion/form-success-confirmation.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  );
}
