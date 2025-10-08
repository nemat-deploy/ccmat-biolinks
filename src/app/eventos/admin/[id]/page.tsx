// src/app/eventos/admin/[id]/page.tsx
"use client";

import { useEffect, useState, Fragment, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { parseTimestamp } from "@/lib/utils";
import { debugLog } from "@/lib/logger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faPenToSquare,
  faTrash,
  faUserShield, // ✅ NOVO ÍCONE
} from "@fortawesome/free-solid-svg-icons";
import { Evento, ParticipanteData } from "@/types";
import Link from "next/link";
import "./page.css";
import React from "react";
import LoadingMessage from "@/app/components/LoadingMessage";

export default function AdminEventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ParticipanteData>>({
    cpf: "",
    nome: "",
    email: "",
    telefone: "",
    institution: "",
    isMonitor: false, // ✅ NOVO
  });

  const normalizeText = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // filtrar participantes
  const filteredParticipantes = useMemo(() => {
    if (!searchTerm) return participantes;

    const normalizedSearch = normalizeText(searchTerm);
    return participantes.filter((p) => {
      const normalizedNome = normalizeText(p.nome);
      return normalizedNome.includes(normalizedSearch);
    });
  }, [participantes, searchTerm]);

  // listener for Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchTerm("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ordenar participantes
  const participantesOrdenados = useMemo(() => {
    return [...filteredParticipantes].sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );
  }, [filteredParticipantes]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/eventos/login");
      if (!id || typeof id !== "string") {
        setErro("ID inválido");
        setLoading(false);
        return;
      }

      try {
        await loadEvento(id);
        await loadParticipantes(id);
      } catch (e) {
        console.error(e);
        setErro("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router]);

  async function loadEvento(eventoId: string) {
    const ref = doc(db, "eventos", eventoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Evento não encontrado");
    const data = snap.data();
    setEvento({
      id: snap.id,
      ...data,
      startDate: parseTimestamp(data.startDate),
      endDate: parseTimestamp(data.endDate),
      registrationDeadLine: parseTimestamp(data.registrationDeadLine),
    } as Evento);
  }

  async function loadParticipantes(eventoId: string) {
    const ref = collection(db, `eventos/${eventoId}/inscricoes`);
    const snap = await getDocs(ref);
    const list: ParticipanteData[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        cpf: docSnap.id,
        nome: d.nome || "",
        email: d.email || "",
        telefone: d.telefone || "",
        institution: d.institution || "",
        dataInscricao: d.dataInscricao?.toDate?.() ?? null,
        isMonitor: d.isMonitor ?? false, // ✅ NOVO
      };
    });
    setParticipantes(list);
    debugLog(`Carregados ${list.length} participantes`);
  }

  async function excluirParticipante(partId: string) {
    if (!confirm("Deseja mesmo excluir?")) return;
    try {
      await deleteDoc(doc(db, `eventos/${id}/inscricoes`, partId));
      await updateDoc(doc(db, "eventos", id as string), {
        registrationsCount: increment(-1),
      });
      setParticipantes((prev) => prev.filter((p) => p.id !== partId));
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir");
    }
  }

  function startEdicao(p: ParticipanteData) {
    setEditingId(p.id);
    setForm({
      cpf: p.cpf,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone || "",
      institution: p.institution || "",
      isMonitor: p.isMonitor ?? false, // ✅ NOVO
    });
  }

  // ✅ AJUSTE: Função atualizada para lidar com checkbox
  function onChangeForm(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function salvarEdicao() {
    if (!editingId || !id) return;
    try {
      // Cria um objeto com os dados a serem atualizados
      const dadosAtualizados = {
        nome: form.nome ?? "",
        email: form.email ?? "",
        telefone: form.telefone ?? "",
        institution: form.institution ?? "",
        isMonitor: form.isMonitor ?? false,
      };
      
      await updateDoc(doc(db, `eventos/${id}/inscricoes`, editingId), dadosAtualizados);
      
      setParticipantes((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...dadosAtualizados } : p)),
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar edição");
    }
  }

  if (loading) {
    return <LoadingMessage text="Carregando página do evento" fullHeight delay={0} />;
  }
  if (erro) return <p>{erro}</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <div className="topContent">
        <div className="usuarios-header">
          <h1 className="titleCourse">
            <span className="titleNameEvento">{evento?.name || id}</span> (
            {participantes.length} inscrições)
          </h1>
          <a href="/eventos/admin" className="voltar-admin-link">
            ← Voltar
          </a>
        </div>

        {id && (
          <p
            style={{
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
              color: "#0070f3",
            }}
          >
            <strong>Link do evento:</strong>{" "}
            <a
              href={`https://matematica-ufdpar.vercel.app/eventos/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              https://matematica-ufdpar.vercel.app/eventos/{id}
            </a>
          </p>
        )}

        <p className="linksInscritos">
          <Link
            href={`/eventos/admin/evento/${id}/presenca`}
            target="_blank"
            rel="noopener noreferrer"
            className="linkRegistrarPresenca"
          >
            registrar presenças
          </Link>

          <Link
            href={`/eventos/admin/evento/${id}/folha-assinaturas`}
            className="linkImprimirFolha"
            target="_blank"
            rel="noopener noreferrer"
          >
            imprimir folha de assinaturas
          </Link>

          <Link
            href={`/eventos/admin/${id}/elegiveis-certificado`}
            className="linkImprimirElegiveis"
            target="_blank"
            rel="noopener noreferrer"
          >
            elegíveis para certificado
          </Link>
          {/* ✅ NOVO: Link para a página de monitores */}
          <Link 
            href={`/eventos/admin/${id}/monitores`} 
            className="linkListarMonitores" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            listar monitores
          </Link>
        </p>
      </div>

      <div
        className="search-container"
        style={{ margin: "1rem auto", maxWidth: "960px" }}
      >
        <div style={{ position: "relative", width: "100%" }}>
          <FontAwesomeIcon
            icon={faSearch}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder="buscar por nome (tecle ESC para limpar)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
              }}
              title="Limpar busca"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th> Nome </th>
            <th> Email </th>
            <th> Telefone </th>
            <th> CPF </th>
            <th> Instituição </th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {participantesOrdenados.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center" }}>
                {searchTerm
                  ? "Nenhum participante encontrado"
                  : "Nenhum participante"}
              </td>
            </tr>
          ) : (
            participantesOrdenados.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>
                    {p.isMonitor && <FontAwesomeIcon icon={faUserShield} title="Monitor/Organizador" style={{ color: '#2962ff', marginRight: '8px' }} />}
                    <strong>{p.nome}</strong>
                  </td>
                  <td data-label="Email:"> {p.email} </td>
                  <td data-label="Telefone:"> {p.telefone} </td>
                  <td data-label="CPF:"> {p.cpf} </td>
                  <td data-label="Instituição:"> {p.institution} </td>
                  <td data-label="Ações:">
                    <button
                      className="btnEditar"
                      title="Editar"
                      onClick={() => startEdicao(p)}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    <button
                      className="btnExcluir"
                      title="Excluir"
                      onClick={() => excluirParticipante(p.cpf)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
                {editingId === p.id && (
                  <tr key={`edit-${p.id}`} className="edit-row">
                    <td colSpan={6}>
                      <div className="edit-form">
                        <label>
                          Nome
                          <input
                            type="text"
                            name="nome"
                            value={form.nome ?? ""}
                            onChange={onChangeForm}
                          />
                        </label>
                        <label>
                          Email
                          <input
                            type="email"
                            name="email"
                            value={form.email ?? ""}
                            onChange={onChangeForm}
                          />
                        </label>
                        <label>
                          Telefone
                          <input
                            type="text"
                            name="telefone"
                            value={form.telefone ?? ""}
                            onChange={onChangeForm}
                          />
                        </label>
                        <label>
                          Instituição
                          <input
                            type="text"
                            name="institution"
                            value={form.institution ?? ""}
                            onChange={onChangeForm}
                          />
                        </label>
                        {/* ✅ NOVO: Checkbox para monitor */}
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="isMonitor"
                            checked={form.isMonitor ?? false}
                            onChange={onChangeForm}
                          />
                          É monitor/organizador do evento?
                        </label>
                        <div className="btns">
                          <button className="save-btn" onClick={salvarEdicao}>
                            Salvar
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

