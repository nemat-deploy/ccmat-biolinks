import './layout.css';
import { ReactNode } from "react";
import Image from 'next/image';
import FooterEventos from '../components/FooterEventos';
import type { Metadata } from 'next';

const EVENTOS_TITLE = 'App EVENTOS | Inscrições, presença e certificados de eventos';
const EVENTOS_DESCRIPTION =
  'App EVENTOS: plataforma para inscrições, controle de presença e emissão de certificados ' +
  'de eventos acadêmicos, cursos, minicursos, palestras, oficinas e congressos.';

// Identidade independente do site principal e neutra (o app atende qualquer
// curso, instituição ou organizador): título, descrição e palavras-chave
// próprios, que sobrescrevem os herdados de src/app/layout.tsx.
export const metadata: Metadata = {
  title: {
    absolute: EVENTOS_TITLE,
    template: '%s | App EVENTOS',
  },
  description: EVENTOS_DESCRIPTION,
  keywords: [
    'App EVENTOS',
    'inscrição em eventos',
    'certificado de evento',
    'controle de presença',
    'eventos acadêmicos',
    'minicursos',
    'palestras',
    'congressos',
  ],
  applicationName: 'App EVENTOS',
  alternates: { canonical: '/eventos' },
  openGraph: {
    title: EVENTOS_TITLE,
    description: EVENTOS_DESCRIPTION,
    url: 'https://matematica-ufdpar.vercel.app/eventos',
    siteName: 'App EVENTOS',
    images: [
      {
        url: 'https://matematica-ufdpar.vercel.app/images/logo-app-eventos-og.png',
        width: 1200,
        height: 630,
        alt: 'Logo App Eventos',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function EventosLayout({ children }: { children: ReactNode }) {
  return (
    <section className="eventos-layout">
      <div className="eventos-top-header">
        <Image
          src="/images/logo-app-eventos.png"
          alt="App Eventos"
          width={151}
          height={34}
          priority
        />
      </div>

      <main>
        {children}
      </main>

      <FooterEventos />
    </section>
  );
}