import type { MetadataRoute } from "next";
import { getAllDocSlugs } from "@/lib/docs/docs-data";
import { absoluteUrl } from "@/lib/site";

/**
 * Public, indexable routes. Everything under (platform), tuition, (auth)
 * and /no-access requires a session and must never be submitted to Google.
 */
const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
  { path: "/download", changeFrequency: "monthly", priority: 0.7 },
  { path: "/security", changeFrequency: "monthly", priority: 0.5 },
  { path: "/register", changeFrequency: "monthly", priority: 0.6 },
  { path: "/register/school", changeFrequency: "monthly", priority: 0.6 },
  { path: "/demo", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const docEntries: MetadataRoute.Sitemap = getAllDocSlugs().map((segments) => ({
    url: absoluteUrl(`/docs/${segments.join("/")}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...docEntries];
}