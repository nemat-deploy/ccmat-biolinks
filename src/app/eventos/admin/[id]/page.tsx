"use client";

import { useEffect, useState, Fragment } from "react";
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
import { auth, onAuthStateChanged } from "@/lib/firebaseAuth";
import { parseTimestamp } from "@/lib/utils";
import { debugLog } from "@/lib/logger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Evento, Participante } from "@/types";
import Link from "next/link";
import "./page.css";
import { ParticipanteData } from "@/types";
import React from "react";

export default function AdminEventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ParticipanteData>>({
    cpf: "",
    nome: "",
    email: "",
    telefone: "",
    institution: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/eventos/login");
      if (!id || typeof id !== "string") {
        setErro("ID inválido");
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
      name: data.name || "",
      description: data.description || "",
      startDate: parseTimestamp(data.startDate),
      endDate: parseTimestamp(data.endDate),
      registrationDeadLine: parseTimestamp(data.registrationDeadLine),
      maxParticipants: data.maxParticipants ?? 0,
      registrationsCount: data.registrationsCount ?? 0,
      status: data.status || "aberto",
      minAttendancePercentForCertificate:
        data.minAttendancePercentForCertificate ?? 80,
    });
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
    });
  }

  function onChangeForm(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function salvarEdicao() {
    if (!editingId || !id) return;
    try {
      await updateDoc(doc(db, `eventos/${id}/inscricoes`, editingId), {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        institution: form.institution,
      });
      setParticipantes((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar edição");
    }
  }

  if (loading) return <p>Carregando...</p>;
  if (erro) return <p>{erro}</p>;

  // ordenar por ordem alfabética
  const participantesOrdenados = [...participantes].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div style={{ padding: "2rem" }}>
      <h1 className="titleCourse">Admin - {evento?.name || id}</h1>

      {/* exibir a URL aqui */}
      {id && (
        <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "#0070f3" }}>
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

      <p className="totalInscritos">
        <strong>{participantes.length}</strong> participantes inscritos &nbsp;
        <Link 
          href={`/eventos/admin/evento/${id}/presenca`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="linkRegistrarPresenca"
        >
          registrar presenças
        </Link>
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
          {participantes.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                Nenhum participante
              </td>
            </tr>
          ) : (
            participantesOrdenados.map((p) => (
              <Fragment key={p.cpf}>
                <tr>
                  <td> { p.nome } </td>
                  <td> { p.email } </td>
                  <td> { p.telefone } </td>
                  <td> { p.cpf } </td>
                  <td> { p.institution } </td>
                  <td>
                    <button 
                      className="btnEditar" 
                      title="Editar" 
                      onClick={() => startEdicao(p)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
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
                {editingId === p.cpf && (
                  <tr key={`edit-${p.cpf}`}>
                    <td colSpan={4}>
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
                        <div className="btns">
                          <button className="save-btn" onClick={salvarEdicao}>
                            Salvar
                          </button>
                          <button className="cancel-btn" onClick={() => setEditingId(null)}>
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
