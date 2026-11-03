// src/app/robots.ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/eventos/admin/", "/eventos/minhas-inscricoes"],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/eventos/sitemap.xml`],
    host: SITE_URL,
  };
}
