const LOCAL_ORIGIN = "http://localhost:3001";
export const PRODUCTION_DOMAIN = "https://triyantrav1.vercel.app";

/**
 * Explicit canonical public origin. Set on the deployed project; unset during
 * local review so indexing stays off while working on localhost.
 */
export const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

/**
 * Detects whether this build/runtime is Vercel production (not preview or local dev).
 * In Vercel, VERCEL_ENV is "production" for production deployments and "preview" for PR/branch previews.
 */
export const isVercelProduction =
  process.env.VERCEL_ENV === "production" ||
  (Boolean(process.env.VERCEL) &&
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview");

/**
 * Drives every indexing gate:
 * - Enabled on production deployments (via explicit NEXT_PUBLIC_SITE_URL or Vercel production environment)
 * - Safely disabled on localhost, local test runners, and Vercel preview branch deployments to protect against duplicate indexing.
 */
export const hasCanonicalOrigin = Boolean(
  configuredSiteUrl || isVercelProduction,
);

/**
 * Base URL for sitemap, robots, metadata and JSON-LD.
 * Falls back to Vercel's own production URL so that a missing env var can
 * never emit a localhost origin in production, which would ship
 * `Disallow: /` and a localhost sitemap to real crawlers.
 */
export const siteUrl =
  configuredSiteUrl ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : (isVercelProduction ? PRODUCTION_DOMAIN : LOCAL_ORIGIN));

/** Origin only, for strict request-origin allowlisting. */
export const siteOrigin = new URL(siteUrl).origin;