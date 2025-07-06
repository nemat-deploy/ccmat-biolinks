// src/app/eventos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Evento } from "@/types";
import Link from "next/link";
import "./page.css";
import LoadingMessage from "@/app/components/LoadingMessage";
import { updateDoc, doc } from "firebase/firestore";

// Função para converter vários formatos de timestamp em Date
function parseTimestamp(
  value: Date | Timestamp | { toDate?: () => Date } | string | { timestampVFalue?: string } | null | undefined
): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if ((value as any)?.toDate && typeof (value as any).toDate === "function") return (value as any).toDate();
  if (typeof value === "object" && "timestampValue" in value && value.timestampValue) return new Date(value.timestampValue);
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const lista: Evento[] = [];
        const agora = new Date();

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const endDate = parseTimestamp(data.endDate);
          const statusAtual = data.status || "aberto";
          let novoStatus = statusAtual;

          // Atualiza status se evento terminou
          if (endDate && endDate < agora && statusAtual !== "encerrado") {
            try {
              await updateDoc(doc(db, "eventos", docSnap.id), { status: "encerrado" });
              novoStatus = "encerrado";
            } catch (error) {
              console.error(`Erro ao atualizar status do evento ${docSnap.id}`, error);
            }
          }

          lista.push({
            id: docSnap.id,
            name: data.name || "Sem título",
            description: data.description || "",
            startDate: parseTimestamp(data.startDate),
            endDate,
            registrationDeadLine: parseTimestamp(data.registrationDeadLine),
            maxParticipants: Number(data.maxParticipants) || 0,
            registrationsCount: Number(data.registrationsCount) || 0,
            status: novoStatus,
            minAttendancePercentForCertificate: Number(data.minAttendancePercentForCertificate) || 80
          });
        }

        // Ordenação personalizada: eventos em andamento primeiro
        lista.sort((a, b) => {
          const aTerminou = a.endDate ? a.endDate < agora : false;
          const bTerminou = b.endDate ? b.endDate < agora : false;

          if (aTerminou !== bTerminou) {
            return aTerminou ? 1 : -1;
          }

          const aDeadline = a.registrationDeadLine?.getTime() ?? Infinity;
          const bDeadline = b.registrationDeadLine?.getTime() ?? Infinity;

          return aDeadline - bDeadline;
        });

        setEventos(lista);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventos();
  }, []);

  if (loading) {
    return <LoadingMessage text="Carregando eventos..." fullHeight delay={0} />;
  }

  return (
    <div className="listaTodosEventos">
      <p className="titleEventos">Eventos disponíveis</p>

      {eventos.length === 0 ? (
        <p>Nenhum evento encontrado.</p>
      ) : (
        <ul className="eventosGrid">
          {eventos.map((evento) => (
            <li key={evento.id} className="eventoCard">
              <Link href={`/eventos/${evento.id}`} className="eventoLink">
                {evento.name}
              </Link>
              <p className="eventoDescription">{evento.description}</p>
              <p className="eventoDatas">
                De {evento.startDate?.toLocaleDateString("pt-BR") || "sem data"} até{" "}
                {evento.endDate?.toLocaleDateString("pt-BR") || "sem data"}
              </p>
              <p className="eventoStatus">Status: {evento.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
