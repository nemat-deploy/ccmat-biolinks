// src/app/eventos/admin/gerenciar/novo/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EventoForm from "../../../components/EventoForm";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { Evento } from "@/types";

export default function NovoEventoPage() {
  const router = useRouter();
  const [slugExists, setSlugExists] = useState(false);
  const [eventoId, setEventoId] = useState("");
  const [eventoCriado, setEventoCriado] = useState<string | null>(null);
  // quando criar o evento com sucesso:
  const handleEventoCriado = (novoSlug: string) => {
    // redireciona para a página de confirmação com o slug na query
    router.push(`/eventos/admin/confirmacao?slug=${novoSlug}`);
  };

  const checkSlug = async (slug: string) => {
    const ref = doc(db, "eventos", slug);
    const snapshot = await getDoc(ref);
    return snapshot.exists();
  };

  useEffect(() => {
    if (eventoId) {
      checkSlug(eventoId).then(setSlugExists);
    }
  }, [eventoId]);

  return (
    <div>
      <h1 style={{ textAlign: 'center', marginTop: '30px', fontSize: '22px' }}>Criar novo evento</h1>
      
      {/* mostra a URL se o evento for criado */}
      {eventoCriado && (
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Evento criado! Acesse: <br />{" "}
          <a
            href={`https://matematica-ufdpar.vercel.app/eventos/${eventoCriado}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0070f3", textDecoration: "underline" }}
          >
            https://matematica-ufdpar.vercel.app/eventos/{eventoCriado}
          </a>
        </p>
      )}

      <EventoForm
        isEditing={false}
        eventoId={eventoId}
        setEventoId={setEventoId}
        slugExists={slugExists}
        onEventoCriado={handleEventoCriado}
      />
    </div>
  );
}
