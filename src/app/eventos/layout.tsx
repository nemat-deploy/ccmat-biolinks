import './layout.css';
import { ReactNode } from "react";
import Image from 'next/image';
import FooterEventos from '../components/FooterEventos';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'App EVENTOS',
  description: 'by NEMAT/UFDPar',
  openGraph: {
    title: 'App EVENTOS',
    description: 'by NEMAT/UFDPar',
    url: 'https://matematica-ufdpar.vercep.app/eventos',
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