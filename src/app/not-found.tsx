// src/app/not-found.tsx
"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>⚠️ Página não encontrada</h1>
      <p>Voltar para <Link href="/eventos">eventos</Link></p>
    </div>
  );
}