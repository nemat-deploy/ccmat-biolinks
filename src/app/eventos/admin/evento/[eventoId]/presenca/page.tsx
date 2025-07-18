// src/app/eventos/admin/evento/[eventoId]/presenca/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInscritos, marcarPresenca } from "@/lib/firebase/eventos";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./page.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { arrayUnion } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import Modal from "./components/Modal";
import "@/app/eventos/admin/evento/[eventoId]/presenca/components/modal.css";
import LoadingMessage from "@/app/components/LoadingMessage";

export default function PresencePage() {
  const params = useParams();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true); // usado no useEffect
  const [actionLoading, setActionLoading] = useState(false); // usado nos botões

  // UI states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const [inscritos, setInscritos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [nomeEvento, setNomeEvento] = useState<string | null>(null);

  const eventoId = Array.isArray(params.eventoId)
    ? params.eventoId[0]
    : params.eventoId;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push(
          "/eventos/login?redirect=" +
            encodeURIComponent(window.location.pathname),
        );
        return;
      }
      setAuthChecked(true);
      loadInscritos();
    });

    return () => unsubscribe();
  }, []);

  const loadInscritos = async () => {
    try {
      if (!eventoId) throw new Error("EventoId não definido.");
      const eventoRef = doc(db, "eventos", eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (eventoSnap.exists()) {
        setNomeEvento(eventoSnap.data().name);
      } else {
        setNomeEvento(null);
      }

      const lista = await getInscritos(eventoId);
      setInscritos([...lista].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (error) {
      console.error("Erro ao carregar inscritos:", error);
    } finally {
      setPageLoading(false); // apenas no carregamento inicial
    }
  };

  const handlePresenca = async (inscritoId: string) => {
    try {
      setActionLoading(true);

      if (!eventoId) throw new Error("EventoId não definido.");

      await marcarPresenca(eventoId, inscritoId);

      setInscritos((prev) =>
        prev.map((inscrito) =>
          inscrito.id === inscritoId
            ? {
                ...inscrito,
                attendances: [
                  ...(inscrito.attendances || []),
                  {
                    timestamp: new Date(),
                  },
                ],
              }
            : inscrito,
        ),
      );
    } catch (error: any) {
      console.error("Erro completo:", error);
      setModalMessage(error.message);
      setModalOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAtividadeFinal = async (participantId: string) => {
    try {
      setLoading(true);
      if (!eventoId) throw new Error("EventoId não definido.");

      const participantRef = doc(
        db,
        "eventos",
        eventoId,
        "inscricoes",
        participantId,
      );
      const participantSnap = await getDoc(participantRef);

      if (participantSnap.exists()) {
        const current = participantSnap.data().enviou_atividade_final || false;

        await updateDoc(participantRef, {
          enviou_atividade_final: !current,
        });

        setInscritos((prev) =>
          prev.map((inscrito) =>
            inscrito.id === participantId
              ? { ...inscrito, enviou_atividade_final: !current }
              : inscrito,
          ),
        );
      }
    } catch (error: any) {
      console.error("Erro ao atualizar atividade final:", error);
      setModalMessage(error.message || "Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  };

  const inscritosFiltrados = inscritos.filter(
    (i) =>
      i.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      i.cpf?.replace(/\D/g, "").includes(filtro.replace(/\D/g, "")),
    // || se buscar por cpf, adicionar linha abaixo:
    // i.id?.replace(/\D/g, '').includes(filtro.replace(/\D/g, ''))
  );

  if (pageLoading) {
    return (
      <LoadingMessage text="Carregando lista de participantes..." fullHeight />
    );
  }

  return (
    <>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Erro ao marcar presença"
        message={modalMessage}
      />
      <div className="presenca-container">
        <div className="presenca-header">
          <h1>Controle de Presença </h1>
          <button onClick={() => window.close()} className="voltar-admin-link">
            ← voltar
          </button>
        </div>
        <div className="eventoTitle">{nomeEvento || eventoId}</div>

        <div>
          <input
            type="text"
            placeholder="buscar por nome..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="input-search"
          />

          <table className="presenca-table">
            <thead>
              <tr>
                <th className="th-nome">Nome</th>
                <th className="th-centro">Presenças</th>
                <th className="th-centro">Atividade Final Enviada?</th>
                <th className="th-centro">Ações</th>
              </tr>
            </thead>
            <tbody>
              {inscritosFiltrados.map((inscrito) => (
                <tr key={inscrito.id}>
                  <td className="td-nome">
                    <span className="inscritoNome">{inscrito.nome}</span>
                  </td>
                  <td data-label="Presenças:" className="td-presencas">
                    {inscrito.attendances?.length || 0}
                  </td>
                  <td
                    data-label="Atividade Final Entregue?"
                    className="td-checkbox"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(inscrito.enviou_atividade_final)}
                      onChange={() => toggleAtividadeFinal(inscrito.id)}
                      disabled={actionLoading}
                      className="checkboxAtividadeFinal"
                    />
                  </td>

                  <td data-label="Ações:" className="td-checkbox">
                    <button
                      onClick={() => handlePresenca(inscrito.id)}
                      disabled={actionLoading}
                      className="presenca-button"
                    >
                      {actionLoading ? "Processando..." : "Marcar Presença"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
