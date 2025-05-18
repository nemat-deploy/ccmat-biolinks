import type { ReactNode } from "react";
import './page.css'

export default function EventosLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="top-header">
        <h1>Universidade Federal do Delta do Parnaíba</h1>
        <h2>Núcleo de Estudos em Matemática</h2>
      </div>
      {children}
    </section>
  );
}
