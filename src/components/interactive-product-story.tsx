"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { productStorySteps } from "@/lib/product-story-data";
import { useRGBInteraction } from "./rgb-interaction";
import { Arrow } from "./shared";
import { track } from "./analytics";
import "./interactive-product-story.css";

export function InteractiveProductStory() {
  const rootRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const current = productStorySteps[activeStep];

  // Integrate with shared RGB interaction
  useRGBInteraction(rootRef, "[data-rgb]");

  function handleSelectStep(index: number) {
    setActiveStep(index);
    track("product_story_step_selected", {
      step: productStorySteps[index].id,
      label: productStorySteps[index].label,
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const count = productStorySteps.length;
    let nextIndex = activeStep;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (activeStep + 1) % count;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = (activeStep - 1 + count) % count;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = count - 1;
        break;
      default:
        return;
    }

    handleSelectStep(nextIndex);
    const targetTab = rootRef.current?.querySelector<HTMLButtonElement>(
      `#story-tab-${productStorySteps[nextIndex].id}`
    );
    targetTab?.focus();
  }

  return (
    <section
      ref={rootRef}
      id="product-story"
      className="section wrap interactive-story-section"
      aria-label="Interactive Product Story: Rent, Procure, Manage"
    >
      <div className="product-story-card">
        {/* Left Column: Horizontal Navigation & Narrative Panel */}
        <div className="product-story-left">
          {/* Top Tabs */}
          <div
            className="story-tabs-bar"
            role="tablist"
            aria-label="Product story workflow phases"
            onKeyDown={handleKeyDown}
          >
            {productStorySteps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.id}
                  id={`story-tab-${step.id}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`story-panel-${step.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`story-tab-btn ${isSelected ? "is-active" : ""}`}
                  onClick={() => handleSelectStep(idx)}
                >
                  <span className="story-tab-num">{step.number}</span>
                  <span className="story-tab-label">{step.label}</span>
                  {isSelected && <span className="story-tab-indicator" />}
                </button>
              );
            })}
          </div>
          <div className="story-tabs-divider" aria-hidden="true" />

          {/* Active Step Content */}
          <div
            id={`story-panel-${current.id}`}
            role="tabpanel"
            aria-labelledby={`story-tab-${current.id}`}
            className="story-panel-content"
          >
            <span className="story-step-index">{current.number}</span>

            {/* Semantic contextual badges for assistive tech & QA verification */}
            <span className="sr-only stage-badge">{current.visualBadge}</span>
            <span className="sr-only stage-view-title">{current.visualTitle}</span>

            <h2 className="story-step-headline">
              {current.id === "rent" ? (
                <>
                  Equip the team.
                  <br />
                  Keep your options.
                </>
              ) : current.id === "procure" ? (
                <>
                  Source fleet hardware.
                  <br />
                  Through a verified network.
                </>
              ) : (
                <>
                  Keep every laptop accounted for.
                  <br />
                  Supported and renewed.
                </>
              )}
            </h2>

            <p className="story-step-desc">{current.summary}</p>

            <div className="story-step-cta stage-actions-row">
              <Link
                href={current.ctaHref}
                className="story-cta-link"
                data-cta={`Story ${current.label}`}
              >
                <span>{current.ctaLabel}</span>
                <Arrow direction="right" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Framed Authentic CRM Platform View */}
        <div className="product-story-right">
          <div className="product-story-visual-frame">
            <Image
              src="/crm.png"
              alt="TriYantra Central CRM Platform View"
              width={1672}
              height={941}
              className="product-story-crm-image"
              sizes="(max-width: 960px) 100vw, 680px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
