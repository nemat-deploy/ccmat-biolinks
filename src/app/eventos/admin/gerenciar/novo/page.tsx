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
      <h1 style={{ textAlign: 'center', marginTop: '30px', fontSize: '18px' }}>Criar novo evento</h1>
      <EventoForm
        isEditing={false}
        eventoId={eventoId}
        setEventoId={setEventoId}
        slugExists={slugExists}
      />
    </div>
  );
}
