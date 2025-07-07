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
import { doc, updateDoc } from "firebase/firestore";
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

  async function fetchEventos() {
    try {
      const querySnapshot = await getDocs(collection(db, "eventos"));
      const lista: Evento[] = [];
      const agora = new Date();

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();

        const evento: Evento = {
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
        };

        // Atualiza o status no banco se o evento terminou
        if (
          evento.endDate &&
          evento.endDate < agora &&
          evento.status !== "encerrado"
        ) {
          try {
            await updateDoc(doc(db, "eventos", evento.id), {
              status: "encerrado",
            });
            evento.status = "encerrado";
            console.log(`Status atualizado: ${evento.name}`);
          } catch (error) {
            console.error(`Erro ao atualizar status de ${evento.name}:`, error);
          }
        }

        lista.push(evento);
      }

      lista.sort((a, b) => {
        const statusA = a.status === "encerrado" ? 1 : 0;
        const statusB = b.status === "encerrado" ? 1 : 0;

        // Se um for encerrado e outro não, o encerrado vai depois
        if (statusA !== statusB) return statusA - statusB;

        // Se os dois têm o mesmo status, ordena por data mais recente primeiro
        const dateA = a.startDate || new Date(0);
        const dateB = b.startDate || new Date(0);

        return dateB.getTime() - dateA.getTime();
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
      await import("firebase/firestore").then(async ({ doc, deleteDoc }) => {
        await deleteDoc(doc(db, "eventos", eventoToDelete.id));
        setEventos(eventos.filter((e) => e.id !== eventoToDelete.id));
      });
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
            sair ➔
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
              style={{ textDecoration: "none" }}
            >
              {evento.name || evento.id}
            </Link>

            <div className="actionsBtn">
              <button
                className="btnEditar"
                onClick={() =>
                  router.push(`/eventos/admin/gerenciar/${evento.id}`)
                }
              >
                ✏️ editar
              </button>

              <button
                className="btnExcluir"
                onClick={() => handleDeleteClick(evento)}
              >
                ❌ excluir
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
            Tem certeza que deseja excluir o evento
            <br />
            <span style={{ color: "#0070f3", fontWeight: "500" }}>
              "{eventoToDelete?.name}"
            </span>
            ?
            <br />
            <br />
            <span
              style={{ color: "#d32f2f", fontWeight: 800, fontSize: "18px" }}
            >
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
