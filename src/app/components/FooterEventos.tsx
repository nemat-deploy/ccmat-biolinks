// src/app/eventos/components/FooterEventos.tsx
"use client";

import Link from "next/link";
import "./FooterEventos.css";

export default function FooterEventos() {
  return (
    <footer className="footer-eventos">
      <nav className="footer-nav">
        {/* <Link href="/eventos/">Eventos</Link> */}
        <Link href="/eventos/minhas-inscricoes/">Minhas Inscrições</Link>
        <Link href="/">CCMAT</Link>
        <a href="https://nemat-ufdpar.vercel.app" target="_blank" rel="noopener noreferrer">
          NEMAT
        </a>
      </nav>
      {/*<p className="footer-copy">&copy; {new Date().getFullYear()} NEMAT - Núcleo de Estudos em Matemática.</p>*/}
    </footer>
  );
}
