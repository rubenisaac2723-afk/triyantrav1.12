import type { MetadataRoute } from "next";
import { hasCanonicalOrigin, siteUrl } from "@/lib/site-url";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: hasCanonicalOrigin ? "/" : undefined,
      disallow: hasCanonicalOrigin ? ["/api/", "/confirmation"] : ["/"],
    },
    sitemap: siteUrl + "/sitemap.xml",
  };
}
