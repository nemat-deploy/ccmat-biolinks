// src/app/eventos/sitemap.ts
// Sitemap próprio do App EVENTOS, publicado em /eventos/sitemap.xml
import type { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseTimestamp } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

// Regenera o sitemap no máximo a cada 1 hora (novos eventos aparecem sem novo deploy)
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/eventos`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  ];

  try {
    const snapshot = await getDocs(collection(db, "eventos"));
    snapshot.docs.forEach((d) => {
      const data = d.data() as Record<string, any>;
      const lastModified =
        parseTimestamp(data.updatedAt) ?? parseTimestamp(data.createdAt) ?? parseTimestamp(data.startDate) ?? undefined;
      entries.push({
        url: `${SITE_URL}/eventos/${encodeURIComponent(d.id)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  } catch (error) {
    // Se o Firestore falhar, publica ao menos a página principal de eventos
    console.error("Erro ao gerar sitemap de eventos:", error);
  }

  return entries;
}
