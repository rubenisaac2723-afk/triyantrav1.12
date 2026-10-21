import type { MetadataRoute } from "next";
import { pageMeta } from "@/lib/content";
import { articles } from "@/lib/articles";
import { siteUrl } from "@/lib/site-url";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
  return [
    ...Object.keys(pageMeta),
    ...articles.map((a) => "/resources/" + a.slug),
  ].map((path) => ({
    url: base + path,
    changeFrequency: path === "/resources" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : path.startsWith("/resources/") ? 0.6 : 0.8,
  }));
}
