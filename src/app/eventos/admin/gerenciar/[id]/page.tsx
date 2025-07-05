// src/app/eventos/admin/gerenciar/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvento } from "@/lib/firebase/eventos";
import EventoForm from "../../../components/EventoForm";
import { Evento } from "@/types";
import './page.css';
import LoadingMessage from "@/app/components/LoadingMessage"

export default function EditarEventoPage() {
  const router = useRouter();
  const { id } = useParams();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id || typeof id !== "string") return;

      const eventoData = await getEvento(id);

      if (!eventoData) {
        alert("Evento não encontrado.");
        router.push("/eventos/admin");
        return;
      }

      setEvento(eventoData);
      setLoading(false);
    };

    fetchEvento();
  }, [id, router]);

  if (loading) {
    return (
      <LoadingMessage text="Carregando formulário..." fullHeight delay={0}/>
    );
  }

  return (
    <div className="container">
      <h1 className="titleEditEvento">Editar evento: <span className="eventoToEdit">{evento?.name}</span></h1>
      <EventoForm
        isEditing={true}
        eventoId={id as string}
        eventoData={evento}
      />
    </div>
  );
}
