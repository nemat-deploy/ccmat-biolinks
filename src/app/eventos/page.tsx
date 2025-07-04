"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { Evento } from "@/types";
import Link from "next/link";
import './page.css'

// função pra converter Timestamp, Date ou string em Date
function parseTimestamp(
  value: Date | Timestamp | { toDate?: () => Date } | string | { timestampValue?: string } | null | undefined
): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if ((value as any)?.toDate && typeof (value as any).toDate === "function") {
    return (value as any).toDate();
  }

  if (typeof value === "object" && "timestampValue" in value && value.timestampValue) {
    return new Date(value.timestampValue);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
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

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          lista.push({
            id: docSnap.id,
            name: data.name || "Sem título",
            description: data.description || "",
            startDate: parseTimestamp(data.startDate),
            endDate: parseTimestamp(data.endDate),
            registrationDeadLine: parseTimestamp(data.registrationDeadLine),
            maxParticipants: Number(data.maxParticipants) || 0,
            registrationsCount: Number(data.registrationsCount) || 0,
            status: data.status || "aberto",
            minAttendancePercentForCertificate: Number(data.minAttendancePercentForCertificate) || 80
          });
        });

        // console.log("Eventos carregados:", lista);
        setEventos(lista);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventos();
  }, []);

  if (loading) return <p className="loadingEvents">Carregando eventos...</p>;

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
{/*      <Link href="/eventos/admin" style={{ color: "#0070f3" }}>
        → Área administrativa
      </Link>*/}