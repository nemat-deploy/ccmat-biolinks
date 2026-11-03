// src/app/eventos/login/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

// Página de login não deve aparecer nos resultados de busca
export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
