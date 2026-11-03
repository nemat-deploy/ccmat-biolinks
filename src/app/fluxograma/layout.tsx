// src/app/fluxograma/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fluxograma do Curso de Matemática",
  description:
    "Fluxograma completo, fluxograma resumido e pré-requisitos das disciplinas do curso de Licenciatura em Matemática da UFDPar.",
  alternates: { canonical: "/fluxograma" },
};

export default function FluxogramaLayout({ children }: { children: ReactNode }) {
  return children;
}
