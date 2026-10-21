"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { workspaceOrbitNodes } from "@/lib/workspace-orbit-data";
import { orbitNodeGeometry, formatCoord } from "@/lib/orbit-geometry";
import "./workspace-orbit.css";

const STAGE_SIZE = 480;
const RING_RADIUS = STAGE_SIZE * 0.42;
const INNER_RADIUS = STAGE_SIZE * 0.19;
const NODE_RADIUS_PERCENT = 37;
const CENTER_COORD = formatCoord(STAGE_SIZE / 2);

export function WorkspaceOrbit() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        root.dataset.inview = entry.isIntersecting ? "true" : "false";
      },
      { rootMargin: "40px" },
    );
    observer.observe(root);
    const onReducedChange = () => {
      if (reduced.matches) root.dataset.inview = "true";
    };
    reduced.addEventListener("change", onReducedChange);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", onReducedChange);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      id="workspace-orbit"
      className="workspace-orbit"
      data-inview="false"
      aria-label="TriYantra services orbiting your workplace: procure, rent, deploy, support, manage, renew"
    >
      {/* Desktop & Tablet Circular Orbit */}
      <div className="orbit-stage-wrapper" aria-hidden="false">
        <span className="orbit-stage-glow" aria-hidden="true" />

        <svg
          className="orbit-svg-tracks"
          viewBox={`0 0 ${STAGE_SIZE} ${STAGE_SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={STAGE_SIZE / 2}
            cy={STAGE_SIZE / 2}
            r={INNER_RADIUS}
            className="orbit-track-inner"
          />
          <circle
            cx={STAGE_SIZE / 2}
            cy={STAGE_SIZE / 2}
            r={RING_RADIUS}
            className="orbit-track-circle"
          />
          {workspaceOrbitNodes.map((node) => {
            const geo = orbitNodeGeometry(
              node.angleDeg,
              STAGE_SIZE,
              RING_RADIUS,
              NODE_RADIUS_PERCENT,
            );
            return (
              <line
                key={`line-${node.id}`}
                x1={CENTER_COORD}
                y1={CENTER_COORD}
                x2={geo.x2}
                y2={geo.y2}
                className="orbit-ray-line"
              />
            );
          })}
        </svg>

        <div className="orbit-center-core">
          <h3 className="center-core-title">CONNECTED WORKPLACE TECHNOLOGY</h3>
        </div>

        <div className="orbit-nodes-ring">
          {workspaceOrbitNodes.map((node) => {
            const geo = orbitNodeGeometry(
              node.angleDeg,
              STAGE_SIZE,
              RING_RADIUS,
              NODE_RADIUS_PERCENT,
            );
            return (
              <div
                key={node.id}
                className="orbit-node-anchor"
                style={{ left: geo.left, top: geo.top }}
              >
                {node.interactive ? (
                  <Link
                    href={node.href}
                    className="orbit-node-card"
                    aria-label={`${node.label}: explore how TriYantra helps`}
                  >
                    <span className="node-label">{node.label}</span>
                  </Link>
                ) : (
                  <span className="orbit-node-card" aria-hidden="false">
                    <span className="node-label">{node.label}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Simplified Flow (< 768px) */}
      <div
        className="orbit-mobile-container"
        aria-label="Workplace ecosystem services"
      >
        <span className="orbit-mobile-eyebrow">Ecosystem</span>
        <strong className="orbit-mobile-title">
          CONNECTED WORKPLACE TECHNOLOGY
        </strong>
        <div className="orbit-mobile-grid">
          {workspaceOrbitNodes.map((node) => (
            <Link
              key={`m-${node.id}`}
              href={node.href}
              className="orbit-mobile-chip"
            >
              {node.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}