import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: { qualities: [100, 75] },
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      {
        source: "/book-a-demo",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/it-asset-management",
        destination: "/platform",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terms-conditions",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; frame-src 'self' https://www.google.com https://maps.google.com; img-src 'self' data: https://*.google.com https://*.googleapis.com https://*.gstatic.com; font-src 'self'; connect-src 'self'; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};
export default config;
