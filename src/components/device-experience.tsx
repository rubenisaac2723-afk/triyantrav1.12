"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { StoryMotion } from "./story-motion";
import { Arrow } from "./shared";

const chapters = [
  {
    label: "Rent",
    title: "Equip the team. Keep your options.",
    text: "Explore rental and Device-as-a-Service around your team's needs. Confirm the configuration, term and availability against your requirement.",
    detail: "Configuration → agreed term → fulfilment",
    link: "/laptop-desktop-rental",
    cta: "Explore device rental",
  },
  {
    label: "Procure",
    title: "The right fit. From the start.",
    text: "Start with the work your team needs to do. Connect device requirements, configurations and supplier sourcing in one conversation.",
    detail: "Requirement → supplier matching → quote",
    link: "/it-device-procurement",
    cta: "Explore procurement",
  },
  {
    label: "Manage",
    title: "A device is only the beginning.",
    text: "Connect devices to the people using them. Explore how assignments, support, renewals and returns fit into the proposed platform workflow.",
    detail: "Assignment → support → renewal or return",
    link: "/platform",
    cta: "Explore platform management",
  },
] as const;

export function DeviceExperience() {
  const root = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const current = chapters[chapter];

  return (
    <div className="device-experience" ref={root}>
      <StoryMotion root={root} kind="device" phase={chapter} />
      <div className="device-story-rule" aria-hidden="true" />
      <div className="device-story-copy">
        <div
          className="device-chapters"
          role="group"
          aria-label="Explore workplace services"
        >
          {chapters.map((item, i) => (
            <button
              key={item.label}
              aria-pressed={chapter === i}
              aria-controls="device-story-content"
              onClick={() => setChapter(i)}
            >
              <span>0{i + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
        <div id="device-story-content" aria-live="polite" aria-atomic="true">
          <span className="device-chapter-index" aria-hidden="true">
            0{chapter + 1}
          </span>
          <h2>{current.title}</h2>
          <p>{current.text}</p>
          <p className="device-story-detail">{current.detail}</p>
          <Link
            className="text-link"
            href={current.link}
            data-cta={current.cta}
          >
            {current.cta}
            <Arrow direction="right" />
          </Link>
        </div>
      </div>
      <div className="device-studio">
        <div className="studio-topline">
          <span>Workplace essentials</span>
          <span>Interactive illustration</span>
        </div>
        <div className="device-stage">
          <Image
            className="studio-poster"
            src="/images/connected-workplace-hero.webp"
            alt="Illustrative workplace laptop, monitor and desktop"
            width={1536}
            height={1024}
            sizes="(max-width: 760px) 100vw, 700px"
            draggable={false}
          />
        </div>
        <div className="studio-controls">
          <p>Explore a service, then take a closer look at the device.</p>
        </div>
        <p className="studio-note">
          Concept device illustration. No brand, configuration or availability
          implied.
        </p>
      </div>
    </div>
  );
}
