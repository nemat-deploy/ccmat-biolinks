// src/app/eventos/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Evento } from "@/types";
import Link from "next/link";
import "./page.css";
import LoadingMessage from "@/app/components/LoadingMessage";

// Função para converter vários formatos de timestamp em Date
function parseTimestamp(
  value: Date | Timestamp | string | { timestampValue?: string | number } | null | undefined
): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if ((value as Timestamp)?.toDate && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate();
  }
  if (typeof value === "object" && value !== null && "timestampValue" in value) {
    const raw = (value as { timestampValue?: string | number }).timestampValue;
    if (typeof raw === "string" || typeof raw === "number") {
      return new Date(raw);
    }
  }
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
            imageUrl: data.imageUrl || '',
            startDate: parseTimestamp(data.startDate),
            endDate,
            registrationDeadLine: parseTimestamp(data.registrationDeadLine),
            maxParticipants: Number(data.maxParticipants) || 0,
            registrationsCount: Number(data.registrationsCount) || 0,
            status: novoStatus,
            minAttendancePercentForCertificate: Number(data.minAttendancePercentForCertificate) || 80,
            createdBy: data.createdBy,
            admins: data.admins || [],
          });
        }

        // Ordenação para colocar eventos encerrados por último
        lista.sort((a, b) => {
          const statusA = a.status === "encerrado" ? 1 : 0;
          const statusB = b.status === "encerrado" ? 1 : 0;

          if (statusA !== statusB) return statusA - statusB;

          const dateA = a.startDate || new Date(0);
          const dateB = b.startDate || new Date(0);

          return dateB.getTime() - dateA.getTime();
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
      <h1 className="titleEventos">Eventos Disponíveis</h1>

      {eventos.length === 0 ? (
        <p className="nenhum-evento">Nenhum evento encontrado no momento.</p>
      ) : (
        <ul className="eventosGrid">
          {eventos.map((evento) => (
            <li key={evento.id} className="eventoCard">
              <Link href={`/eventos/${evento.id}`} className="eventoLink">
                {/* ✅ AJUSTE: A tag da imagem foi removida daqui */}
                <div className="eventoCard-content">
                  <h2 className="eventoCard-title">{evento.name}</h2>
                  <div 
                    className="eventoDescription"
                    dangerouslySetInnerHTML={{ __html: evento.description }} 
                  />
                  <div className="eventoCard-footer">
                    <p className="eventoDatas">
                      Inicia em: {evento.startDate?.toLocaleDateString("pt-BR") || "N/D"}
                    </p>
                    <span className={`eventoStatus status-${evento.status}`}>{evento.status}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

