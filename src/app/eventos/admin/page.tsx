"use client";

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { useEffect, useState } from "react";
import { collection, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { auth, onAuthStateChanged } from "@/lib/firebaseAuth";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Evento } from "@/types"; // ✅ Tipo importado
import { parseTimestamp } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import { TimestampValue } from "@/types";
import './page.css'

export default function AdminPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // redirecionar se não estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/eventos/login");
      } else {
        setUser(currentUser);
        await fetchEventos();
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Converte diferentes formatos de data em Date ou null
   * @param value - Pode ser Timestamp, objeto com timestampValue, string ISO ou Date
   * @returns Date | null
   */
  function parseTimestamp(
    value: Date | Timestamp | string | TimestampValue | null | undefined
  ): Date | null {
    if (!value) return null;

    // Se for objeto Date
    if (value instanceof Date) {
      return value;
    }

    // Se for Timestamp do Firebase
    if ((value as Timestamp)?.toDate && typeof (value as Timestamp).toDate === "function") {
      return (value as Timestamp).toDate();
    }

    // Se for objeto com timestampValue (ex: API REST)
    if (typeof value === "object" && "timestampValue" in value && value.timestampValue) {
      const date = new Date(value.timestampValue);
      return isNaN(date.getTime()) ? null : date;
    }

    // Se for string ISO
    if (typeof value === "string") {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  // Busca todos os eventos
  async function fetchEventos() {
    try {
      const querySnapshot = await getDocs(collection(db, "eventos"));

      const lista: Evento[] = [];

      querySnapshot.forEach((docSnap: QueryDocumentSnapshot) => {
        const data = docSnap.data();

        lista.push({
          id: docSnap.id,
          name: data.name || "Evento sem nome",
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

      setEventos(lista);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      alert("⚠️ Erro ao carregar lista de eventos.");
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Área Administrativa</h1>

      {/* barra de menu */}
      <div className="menuBar">
        <div className="userLogged">
          Logado como: <strong>{user?.email}</strong>
        </div>

        <div className="adminBtns">
          <Link href="/eventos/admin/novo-evento/">
            <button 
              className="btnNewEvent"
            >
              novo evento
            </button>
          </Link>

          <button 
            className="btnSair"
            onClick={() => {
              auth.signOut().then(() => router.push("/eventos/login"));
            }}
          >
            sair
          </button>
        </div>
      </div>

      {/* Lista de eventos */}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {eventos.length === 0 && (
          <li>
            <em>Nenhum evento encontrado.</em>
          </li>
        )}

        {eventos.map((evento) => (
          <li key={evento.id} style={{ marginBottom: "1rem" }}>
            <Link
              href={`/eventos/admin/${evento.id}`}
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#0070f3",
                textDecoration: "none"
              }}
            >
              {evento.name || evento.id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}