// src/app/eventos/layout.tsx
"use client"

import './layout.css'
import { ReactNode } from "react";

export default function EventosLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="eventos-top-header">
        <h1>Universidade Federal do Delta do Parnaíba</h1>
        <h2>Núcleo de Estudos em Matemática</h2>
      </div>
      {children}
    </section>
  );
}