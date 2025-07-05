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

export default function PresencePage() {
  const params = useParams();
  const router = useRouter();

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
  }, [router]);

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
      setLoading(false);
    }
  };

  const handlePresenca = async (inscritoId: string) => {
    try {
      setLoading(true);

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
      setModalMessage(error.message); // Preenche a mensagem do modal
      setModalOpen(true); // Abre o modal
    } finally {
      setLoading(false);
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

  if (authChecked && nomeEvento === null) {
    return (
      <div className="presenca-container">
        <p>⚠️ Acesse essa página a partir do painel de administração.</p>
      </div>
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
      <p className="presencaTitle">
        Controle de Presença -{" "}
        <span className="eventoTitle">{nomeEvento || eventoId}</span>
      </p>

      <input
        type="text"
        placeholder="buscar por nome..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          padding: "0.5rem",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          fontSize: "18px",
        }}
      />

      <table className="presenca-table">
        <thead>
          <tr>
            <th style={{ textAlign: "center" }}>Nome</th>
            <th style={{ textAlign: "center" }}>Presenças</th>
            <th style={{ textAlign: "center" }}>Atividade Final Enviada?</th>
            <th style={{ textAlign: "center" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {inscritosFiltrados.map((inscrito) => (
            <tr key={inscrito.id}>
              <td>{inscrito.nome}</td>
              <td style={{ textAlign: "center" }}>
                {inscrito.attendances?.length || 0}
              </td>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={Boolean(inscrito.enviou_atividade_final)}
                  onChange={() => toggleAtividadeFinal(inscrito.id)}
                  disabled={loading}
                  className="checkboxAtividadeFinal"
                />
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  onClick={() => handlePresenca(inscrito.id)}
                  disabled={loading}
                  className="presenca-button"
                >
                  {loading ? "Processando..." : "Registrar Presença"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
