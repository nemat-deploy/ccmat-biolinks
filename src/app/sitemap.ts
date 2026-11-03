// src/app/sitemap.ts
// Sitemap do site principal. O App EVENTOS tem o próprio: src/app/eventos/sitemap.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/fluxograma`, lastModified: now, changeFrequency: "yearly", priority: 0.8 },
  ];
}
