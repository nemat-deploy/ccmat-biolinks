// src/app/eventos/layout.tsx
"use client";

import './layout.css';
import { ReactNode } from "react";
import Image from 'next/image';
import FooterEventos from '../components/FooterEventos';

export default function EventosLayout({ children }: { children: ReactNode }) {
  return (
    <section className="eventos-layout">
      <div className="eventos-top-header">
        <Image
          src="/images/logo-eventos-nemat.png"
          alt="Descrição da imagem"
          width={210}
          height={60}
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
