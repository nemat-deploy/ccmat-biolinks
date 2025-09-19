// src/app/eventos/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, query, where, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { auth } from "@/lib/firebaseAuth";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Evento } from "@/types";
import { TimestampValue } from "@/types";
import "./page.css";
import LoadingMessage from "@/app/components/LoadingMessage";
import ConfirmationModal from "@/app/components/ConfirmationModal";

// Interface para o usuário da aplicação, incluindo o papel
interface AppUser extends User {
  role?: 'admin' | 'user';
}

export default function AdminPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/eventos/login");
        return;
      }
      
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      const appUser: AppUser = { ...currentUser, role: 'user' };
      let userIsAdmin = false;

      if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
        appUser.role = 'admin';
        userIsAdmin = true;
      }
      
      setUser(appUser);
      setIsAdmin(userIsAdmin);
      await fetchEventos(appUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function fetchEventos(currentUser: AppUser) {
    if (!currentUser?.uid) return;

    try {
      const eventosCollection = collection(db, "eventos");
      let eventosQuery;

      // ✅ AJUSTE PRINCIPAL: Lógica de busca de eventos atualizada
      if (currentUser.role === 'admin') {
        // Se for admin global, busca todos os eventos.
        eventosQuery = query(eventosCollection);
      } else {
        // Se for um usuário comum, busca todos os eventos onde seu UID está na lista 'admins'.
        eventosQuery = query(eventosCollection, where("admins", "array-contains", currentUser.uid));
      }

      const querySnapshot = await getDocs(eventosQuery);
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
          minAttendancePercentForCertificate: Number(data.minAttendancePercentForCertificate) || 80,
          createdBy: data.createdBy,
          admins: data.admins || [],
        };

        if (
          evento.endDate &&
          evento.endDate < agora &&
          evento.status !== "encerrado"
        ) {
          try {
            await updateDoc(doc(db, "eventos", evento.id), { status: "encerrado" });
            evento.status = "encerrado";
          } catch (error) {
            console.error(`Erro ao atualizar status de ${evento.name}:`, error);
          }
        }
        lista.push(evento);
      }

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
      alert("⚠️ Erro ao carregar lista de eventos.");
    }
  }

  function parseTimestamp(
    value: Date | Timestamp | string | TimestampValue | null | undefined,
  ): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if ((value as Timestamp)?.toDate) return (value as Timestamp).toDate();
    if (typeof value === 'object' && 'timestampValue' in value && value.timestampValue) {
      const date = new Date(value.timestampValue);
      return isNaN(date.getTime()) ? null : date;
    }
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

      <div className="menuBar">
        <div className="userLogged">
          <span className="label">Logado como:&nbsp;</span>
          <span className="email">{user?.email}</span>
        </div>
        <div className="adminBtns">
          {isAdmin && (
            <Link href="/eventos/admin/usuarios/">
              <button className="btnUsers">usuários</button>
            </Link>
          )}
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

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {eventos.length === 0 && (
          <li>
            <em>Nenhum evento encontrado. Crie um novo evento para começar.</em>
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

