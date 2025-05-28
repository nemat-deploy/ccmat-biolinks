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
    <div style={{ padding: "12px", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Área Administrativa</h1>

      {/* barra de menu */}
      <div className="menuBar">
        <div className="userLogged">
          Logado como: <strong>{user?.email}</strong>
        </div>

        <div className="adminBtns">
          <Link href="/eventos/admin/gerenciar/novo/">
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

        <div>
          Clique no evento para vê e editar os Participantes
        </div>

      {/* Lista de eventos */}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {eventos.length === 0 && (
          <li>
            <em>Nenhum evento encontrado.</em>
          </li>
        )}
        {eventos.map((evento) => (
          <li 
            className="eventoItems"
            key={evento.id}
          >
            <Link
              href={`/eventos/admin/${evento.id}`}
              style={{
                width: "auto",
                textAlign: "left",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#0070f3",
                textDecoration: "none",
              }}
            >
              {evento.name || evento.id}
            </Link>

            <div className="actionsBtn">
              <button
                className="btnEditar"
                onClick={() => router.push(`/eventos/admin/gerenciar/${evento.id}`)}
                style={{
                  backgroundColor: "#37a9d1",
                  color: "#fff",
                  border: "none",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "80px"
                }}
              >
                Editar
              </button>

              <button
                className="btnExcluir"
                onClick={async () => {
                  if (confirm(`Tem certeza que deseja excluir o evento "${evento.name}"?`)) {
                    try {
                      await import("firebase/firestore").then(async ({ doc, deleteDoc }) => {
                        await deleteDoc(doc(db, "eventos", evento.id));
                        setEventos(eventos.filter(e => e.id !== evento.id));
                      });
                    } catch (error) {
                      console.error("Erro ao excluir evento:", error);
                      alert("❌ Erro ao excluir evento.");
                    }
                  }
                }}
                style={{ backgroundColor: "#d9534f", color: "#fff", border: "none", padding: "0.3rem 0.7rem", borderRadius: "4px", cursor: "pointer", width: "80px" }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}