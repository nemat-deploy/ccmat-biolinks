// src/app/layout.tsx
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import { SITE_URL } from "@/lib/site";

const SITE_DESCRIPTION =
  "Curso de Licenciatura em Matemática da UFDPar (Universidade Federal do Delta do Parnaíba). " +
  "Links oficiais da Coordenação do Curso de Matemática (CCMAT): fluxograma, SIGAA, NEMAT, eventos e contato.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Matemática UFDPar | Licenciatura em Matemática - CCMAT",
    template: "%s | Matemática UFDPar",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "matemática ufdpar",
    "matematica ufdpar",
    "licenciatura em matemática ufdpar",
    "curso de matemática parnaíba",
    "CCMAT UFDPar",
    "coordenação de matemática UFDPar",
    "Universidade Federal do Delta do Parnaíba",
    "fluxograma matemática ufdpar",
  ],
  applicationName: "Matemática UFDPar",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Matemática UFDPar | Licenciatura em Matemática",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Matemática UFDPar",
    images: [
      {
        url: "/images/logo-cmat-perfil.png",
        alt: "Logo da Coordenação do Curso de Matemática da UFDPar",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
  verification: {
    google: "vAjU_JZ9NWDHACY6YTZFCDy24PD0ylLaBBLVBccW6KI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
