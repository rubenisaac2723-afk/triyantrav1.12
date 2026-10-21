"use client";

import { useRef } from "react";
import { officialSocialChannels } from "@/lib/social-data";
import { useRGBInteraction } from "./rgb-interaction";
import { track } from "./analytics";
import "./follow-us.css";

function SocialIcon({ id }: { id: "linkedin" | "youtube" | "instagram" }) {
  switch (id) {
    case "linkedin":
      return (
        <svg
          className="social-icon-svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          className="social-icon-svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          className="social-icon-svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
  }
}

export function FollowUs({ compact = false }: { compact?: boolean }) {
  const rootRef = useRef<HTMLElement>(null);

  // Shared F3 RGB interaction
  useRGBInteraction(rootRef, "[data-rgb]");

  function handleLinkClick(platform: string) {
    track("social_link_clicked", { platform });
  }

  const socialLinks = (
    <div
      className="follow-us-links"
      role="group"
      aria-label="Social media channels"
    >
      {officialSocialChannels.map((channel) => {
        if (channel.verified && channel.url) {
          return (
            <a
              key={channel.id}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={channel.label}
              className="social-button footer-social-link"
              data-rgb
              onClick={() => handleLinkClick(channel.platform)}
            >
              <SocialIcon id={channel.id} />
              <span className="sr-only">{channel.platform}</span>
            </a>
          );
        }

        // Unverified accounts render honestly as a compact non-interactive icon
        // chip: no href, no cursor, no RGB, no hover, no per-icon badge. The
        // single footer status line below conveys "coming soon" for the group.
        return (
          <span
            key={channel.id}
            className="social-button social-pending"
            aria-label={channel.label}
          >
            <SocialIcon id={channel.id} />
            <span className="sr-only">{channel.platform}</span>
          </span>
        );
      })}
    </div>
  );

  if (compact) {
    return (
      <section
        ref={rootRef}
        id="follow-us"
        className="footer-follow"
        aria-label="Follow TriYantra on social platforms"
      >
        <span className="footer-follow-title">Follow TriYantra</span>
        {socialLinks}
        {officialSocialChannels.some((c) => !c.verified) && (
          <p className="footer-follow-note">Social channels coming soon.</p>
        )}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      id="follow-us"
      className="follow-us-section"
      aria-label="Follow TriYantra on social platforms"
    >
      <div className="follow-us-inner">
        <div className="follow-us-info">
          <span className="follow-us-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            Stay Connected
          </span>
          <h3 className="follow-us-title">Follow TriYantra</h3>
          <p className="follow-us-desc">
            Workplace technology insights, hardware updates, and platform
            announcements.
          </p>
        </div>
        {socialLinks}
      </div>
    </section>
  );
}
