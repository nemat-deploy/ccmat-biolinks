"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import './page.css'

// Tipo centralizado (pode vir de @/types)
type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationDeadLine: Date | null;
  maxParticipants: number;
  registrationsCount: number;
  status: "aberto" | "encerrado" | "em breve" | "em andamento";
  minAttendancePercentForCertificate: number;
};

// Função pra converter Timestamp, Date ou string em Date
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

  if (loading) return <p>Carregando eventos...</p>;

  return (
    <div className="listaTodosEventos">

      <div>
      <p className="titleEventos">Eventos disponíveis</p>
      </div>

      {eventos.length === 0 ? (
        <p>Nenhum evento encontrado.</p>
      ) : (
        <ul style={{
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          listStyle: "none",
          paddingLeft: 0,
          flexWrap: "wrap",
          gap: "30px"
        }}>
          {eventos.map((evento) => (
            <li key={evento.id} style={{
              border: "2px solid gray",
              backgroundColor: "#ffffff",
              padding: "12px",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "320px",
              height: "auto",
              minHeight: "150px"
            }}>
              <Link
                href={`/eventos/${evento.id}`}
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#0070f3",
                  textDecoration: "none"
                }}
              >
                {evento.name}
              </Link>
              <p className="eventoDescription">{evento.description}</p>
              <p style={{ color: "green", fontWeight: "bold" }}>
                De {evento.startDate?.toLocaleDateString('pt-BR') || "sem data"} até{" "}
                {evento.endDate?.toLocaleDateString('pt-BR') || "sem data"}
              </p>
              <p>Status: {evento.status}</p>
            </li>
          ))}
        </ul>
      )}

      <br />
{/*      <Link href="/eventos/admin" style={{ color: "#0070f3" }}>
        → Área administrativa
      </Link>*/}
    </div>
  );
}