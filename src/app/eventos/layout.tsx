// src/app/eventos/layout.tsx
"use client"

import './layout.css'
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import Image from 'next/image';

export default function EventosLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <div className="eventos-top-header">
          <Image
            src="/images/logo-eventos-nemat.png" 
            alt="Descrição da imagem"
            width={280} 
            height={80} 
            priority
          />
      </div>
      {children}
    </section>
  );
}