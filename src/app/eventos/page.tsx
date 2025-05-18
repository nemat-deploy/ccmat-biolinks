"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

// Função pra converter Timestamp ou string em Date
function parseTimestamp(value) {
  if (!value) return null;

  // Se for objeto com toDate()
  if (typeof value === "object" && value.toDate) return value.toDate();

  // Se vier como string ISO
  if (typeof value === "string") return new Date(value);

  // Se vier como { timestampValue: '2025-04-04T22:00:00Z' }
  if (value?.timestampValue) return new Date(value.timestampValue);

  return null;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const querySnapshot = await getDocs(collection(db, "eventos"));
        const lista = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          const startDate = parseTimestamp(data.startDate);
          const endDate = parseTimestamp(data.endDate);
          const registrationDeadLine = parseTimestamp(data.registrationDeadLine);

          lista.push({
            id: docSnap.id,
            name: data.name?.stringValue || data.name || "Sem título",
            description: data.description?.stringValue || data.description || "",
            startDate,
            endDate,
            registrationDeadLine,
            maxParticipants: parseInt(
              data.maxParticipants?.integerValue || `${data.maxParticipants || 0}`,
              10
            ),
            registrationsCount: parseInt(
              data.registrationsCount?.integerValue ||
                `${data.registrationsCount || 0}`,
              10
            ),
            status: data.status?.stringValue || data.status || "aberto",
            minAttendancePercentForCertificate: parseInt(
              data.minAttendancePercentForCertificate?.integerValue ||
                `${data.minAttendancePercentForCertificate || 80}`,
              10
            )
          });
        });

        console.log("Eventos carregados:", lista); // 👈 Veja no DevTools
        setEventos(lista);
      } catch (err) {
        console.error("Erro ao carregar eventos:", err.message || err);
      } finally {
        setLoading(false);
      }
    }

    fetchEventos();
  }, []);

  if (loading) return <p>Carregando eventos...</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Eventos</h1>

      {eventos.length === 0 ? (
        <p>Nenhum evento encontrado.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {eventos.map((evento) => (
            <li key={evento.id} style={{ marginBottom: "2rem" }}>
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
              <p>{evento.description}</p>
              <p>
                De{" "}
                {evento.startDate?.toLocaleDateString() || "sem data"} até{" "}
                {evento.endDate?.toLocaleDateString() || "sem data"}
              </p>
              <p>Status: {evento.status}</p>
            </li>
          ))}
        </ul>
      )}

      <br />
      <Link href="/eventos/admin" style={{ color: "#0070f3" }}>
        → Área administrativa
      </Link>
    </div>
  );
}