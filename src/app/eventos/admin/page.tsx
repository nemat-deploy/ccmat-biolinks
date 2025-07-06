// src/app/eventos/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { auth } from "@/lib/firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { Evento } from "@/types";
import { Timestamp } from "firebase/firestore";
import { TimestampValue } from "@/types";
import "./page.css";
import LoadingMessage from "@/app/components/LoadingMessage";
// import ConfirmationModal from "@/app/components/ConfirmationModal";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function AdminPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);

  // redirecionar se não estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/eventos/login");
      } else {
        setUser(currentUser);
        await fetchEventos();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // busca todos os eventos
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
          minAttendancePercentForCertificate:
            Number(data.minAttendancePercentForCertificate) || 80,
        });
      });

      // eventos em andamento primeiro
      const agora = new Date();

      lista.sort((a, b) => {
        const aTerminou = a.endDate ? a.endDate < agora : false;
        const bTerminou = b.endDate ? b.endDate < agora : false;

        // eventos em andamento antes
        if (aTerminou !== bTerminou) {
          return aTerminou ? 1 : -1;
        }

        // ordenado por registrationDeadLine
        const aDeadline = a.registrationDeadLine?.getTime() ?? Infinity;
        const bDeadline = b.registrationDeadLine?.getTime() ?? Infinity;

        return aDeadline - bDeadline;
      });

      setEventos(lista);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      alert("⚠️ Erro ao carregar lista de eventos.");
    }
  }

  /**
   * Converte diferentes formatos de data em Date ou null
   */
  function parseTimestamp(
    value: Date | Timestamp | string | TimestampValue | null | undefined,
  ): Date | null {
    if (!value) return null;

    // se for objeto Date
    if (value instanceof Date) {
      return value;
    }

    //se for Timestamp do Firebase
    if (
      (value as Timestamp)?.toDate &&
      typeof (value as Timestamp).toDate === "function"
    ) {
      return (value as Timestamp).toDate();
    }

    // se for objeto com timestampValue (ex: API REST)
    if (
      typeof value === "object" &&
      "timestampValue" in value &&
      value.timestampValue
    ) {
      const date = new Date(value.timestampValue);
      return isNaN(date.getTime()) ? null : date;
    }

    // se for string ISO
    if (typeof value === "string") {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  const handleDeleteClick = (evento: Evento) => {
    setEventoToDelete(evento);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventoToDelete) return;
    
    try {
      await import("firebase/firestore").then(
        async ({ doc, deleteDoc }) => {
          await deleteDoc(doc(db, "eventos", eventoToDelete.id));
          setEventos(eventos.filter((e) => e.id !== eventoToDelete.id));
        }
      );
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      alert("❌ Erro ao excluir evento.");
    } finally {
      setModalOpen(false);
      setEventoToDelete(null);
    }
  };

  if (loading) {
    return <LoadingMessage fullHeight delay={0} />;
  }

  return (
    <div className="admin-container">
      <h1 className="titleAdmin">Área Administrativa</h1>

      {/* barra de menu */}
      <div className="menuBar">
        <div className="userLogged">
          <span className="label">Logado como: </span>
          <span className="email">{user?.email}</span>
        </div>

        <div className="adminBtns">
          <Link href="/eventos/admin/usuarios/">
            <button className="btnUsers">usuários</button>
          </Link>

          <Link href="/eventos/admin/gerenciar/novo/">
            <button className="btnNewEvent">novo evento</button>
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

      <div className="topMsg">
        Clique no evento para listar os Participantes
      </div>

      {/* lista de eventos */}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {eventos.length === 0 && (
          <li>
            <em>Nenhum evento encontrado.</em>
          </li>
        )}
        {eventos.map((evento) => (
          <li className="eventoItems" key={evento.id}>
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
                onClick={() =>
                  router.push(`/eventos/admin/gerenciar/${evento.id}`)
                }
                style={{
                  backgroundColor: "#37a9d1",
                  color: "#fff",
                  border: "none",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "80px",
                }}
              >
                Editar
              </button>

              <button
                className="btnExcluir"
                onClick={() => handleDeleteClick(evento)}
                style={{
                  backgroundColor: "#d9534f",
                  color: "#fff",
                  border: "none",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "80px",
                }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar exclusão"
        message={
          <>
            Você confirma a exclusão do evento<br/>
            <span style={{ color: '#0070f3', fontWeight: '500' }}>
              "{eventoToDelete?.name}"
            </span>?
            <br /><br />
            <span style={{ color: '#d32f2f', fontWeight: 800, fontSize: '18px' }}>
              Esta ação não pode ser desfeita!
            </span>
          </>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}