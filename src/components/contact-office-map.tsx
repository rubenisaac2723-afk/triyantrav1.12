"use client";

import { useState } from "react";
import "./contact-office-map.css";

// Verified TriYantra / Matrix DaaS Private Limited Headquarters details
const VERIFIED_COMPANY = "Matrix DaaS Private Limited";
const VERIFIED_ADDRESS =
  "1st floor, 36th Cross Rd, 36th main, 4th T Block East, Jayanagara 9th Block, Jayanagar, Bengaluru, Karnataka 560041";
const GOOGLE_MAPS_SHARE_URL = "https://maps.app.goo.gl/P9HmacGke1tQTmND7";

// Official Google Maps Share Embed URL for Matrix DaaS Private Limited (Place CID: 0x3bae15e6e9ee5a2b:0xa58cc5d3ff5ea383)
const DEFAULT_GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7505193952136!2d77.5910326!3d12.9229798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15e6e9ee5a2b%3A0xa58cc5d3ff5ea383!2sMatrix%20DaaS%20Private%20Limited!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin";

export function ContactOfficeMap() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // If NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY is configured, use the official Embed API endpoint;
  // otherwise, use the verified official Google Maps share embed URL.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  const embedSrc = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:ChIJq1ru6e4VrzsRg6Ne_9PFjKU`
    : DEFAULT_GOOGLE_MAPS_EMBED_URL;

  return (
    <article
      className="contact-office-map-card"
      id="office-map"
      aria-label="TriYantra Headquarters Office and Location Map"
    >
      <header className="office-map-header">
        <div className="office-map-badge-row">
          <span className="office-map-badge">
            <span className="office-status-dot" aria-hidden="true" />
            Operations &amp; Device Hub
          </span>
          <span className="office-map-coords" title="Geographic Coordinates">
            12.9230° N, 77.5936° E
          </span>
        </div>
        <h2 className="office-map-title">{VERIFIED_COMPANY}</h2>
        <address className="office-map-address">{VERIFIED_ADDRESS}</address>
      </header>

      <div
        className="office-map-canvas-wrap"
        role="region"
        aria-label="Interactive Google Map of TriYantra Bengaluru office"
        tabIndex={0}
      >
        {/* Placeholder while iframe loads */}
        {!iframeLoaded && !iframeError && (
          <div className="office-map-placeholder" aria-hidden="true">
            <div className="office-map-skeleton-pin" />
            <span>Loading Google Maps...</span>
          </div>
        )}

        {/* Fallback state if iframe fails to load */}
        {iframeError ? (
          <div className="office-map-error-state" role="alert">
            <p>
              Interactive map could not be loaded directly. You can view Matrix DaaS Private Limited directly on Google Maps.
            </p>
            <a
              href={GOOGLE_MAPS_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="office-map-fallback-link"
            >
              Open in Google Maps &rarr;
            </a>
          </div>
        ) : (
          <iframe
            src={embedSrc}
            title="Google Maps location for Matrix DaaS Private Limited"
            className="office-map-iframe"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
          />
        )}
      </div>
    </article>
  );
}
