// src/app/eventos/admin/[id]/page.tsx
"use client";

import { useEffect, useState, Fragment, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { parseTimestamp, formatarNome } from "@/lib/utils";
import { gerarPdfCertificado } from "@/lib/generateCertificate";
import { debugLog } from "@/lib/logger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTimes,
  faPenToSquare,
  faTrash,
  faUserShield, 
  faCertificate,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { Evento, ParticipanteData } from "@/types";
import Link from "next/link";
import "./page.css";
import React from "react";
import LoadingMessage from "@/app/components/LoadingMessage";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';

export default function AdminEventoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [enviandoEmails, setEnviandoEmails] = useState(false);
  const [assuntoEmail, setAssuntoEmail] = useState("Lembrete do Evento");
  const [mensagemEmail, setMensagemEmail] = useState("");
  const [progressoEnvio, setProgressoEnvio] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({
        openOnClick: false, // evitar abrir o link sem querer enquanto edita
      }),
    ],
    immediatelyRender: false,
    content: mensagemEmail,
    onUpdate: ({ editor }) => {
      // O Tiptap já devolve tudo formatadinho em HTML (ex: <p>Texto <strong>negrito</strong></p>)
      setMensagemEmail(editor.getHTML());
    },
  });
  const [mostrarFormEmail, setMostrarFormEmail] = useState(false);

  // Estados para o formulário de Cadastro Manual de Inscrição
  const [mostrarFormNovaInscricao, setMostrarFormNovaInscricao] = useState(false);
  const [salvandoNovaInscricao, setSalvandoNovaInscricao] = useState(false);
  const [novoForm, setNovoForm] = useState({
    cpf: "",
    nome: "",
    email: "",
    telefone: "",
    institution: "UFDPar",
    outraInstituicao: "",
    isMonitor: false,
    isMinistrante: false,
  });

  const nomeAdminInputRef = useRef<HTMLInputElement>(null);
  const outraAdminInputRef = useRef<HTMLInputElement>(null);

  // Foco automático no nome ao abrir o formulário
  useEffect(() => {
    if (mostrarFormNovaInscricao) {
      setTimeout(() => nomeAdminInputRef.current?.focus(), 100);
    }
  }, [mostrarFormNovaInscricao]);

  // Foco automático no campo outraInstituicao ao selecionar "Outra"
  useEffect(() => {
    if (mostrarFormNovaInscricao && novoForm.institution === "Outra") {
      setTimeout(() => outraAdminInputRef.current?.focus(), 100);
    }
  }, [novoForm.institution, mostrarFormNovaInscricao]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ParticipanteData>>({
    cpf: "",
    nome: "",
    email: "",
    telefone: "",
    institution: "",
    isMonitor: false, 
    isMinistrante: false,
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
      const cpfReal = d.cpf ? d.cpf : (docSnap.id.length === 11 && /^\d+$/.test(docSnap.id) ? docSnap.id : "");
      return {
        id: docSnap.id,
        cpf: cpfReal,
        nome: d.nome || "",
        email: d.email || "",
        telefone: d.telefone || "",
        institution: d.institution || "",
        dataInscricao: d.dataInscricao?.toDate?.() ?? null,
        isMonitor: d.isMonitor ?? false, 
        isMinistrante: d.isMinistrante ?? false,
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
      isMonitor: p.isMonitor ?? false, 
      isMinistrante: p.isMinistrante ?? false,
    });
  }

  function onChangeForm(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function salvarEdicao() {
    if (!editingId || !id) return;
    try {
      // criar um objeto com os dados a serem atualizados
      const dadosAtualizados = {
        nome: form.nome ?? "",
        email: form.email ?? "",
        telefone: form.telefone ?? "",
        institution: form.institution ?? "",
        isMonitor: form.isMonitor ?? false,
        isMinistrante: form.isMinistrante ?? false,
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

  async function handleSalvarNovaInscricao(e: React.FormEvent) {
    e.preventDefault();
    if (!id || typeof id !== "string") return;

    if (!novoForm.nome.trim()) {
      alert("Por favor, informe o nome do participante.");
      return;
    }
    if (!novoForm.email.trim()) {
      alert("Por favor, informe o e-mail do participante.");
      return;
    }

    const rawCpf = novoForm.cpf.replace(/\D/g, "");

    // CPF é OPCIONAL no admin. Se informado, valida se tem 11 dígitos.
    if (rawCpf.length > 0 && rawCpf.length !== 11) {
      alert("Se informado, o CPF deve conter 11 dígitos.");
      return;
    }

    const instituicaoFinal = novoForm.institution === "Outra"
      ? (novoForm.outraInstituicao.trim() || "Outra")
      : novoForm.institution;

    // Se informou CPF válido (11 dígitos), usa como ID. Se não, gera ID único no Firestore.
    const docId = rawCpf.length === 11 ? rawCpf : doc(collection(db, `eventos/${id}/inscricoes`)).id;

    setSalvandoNovaInscricao(true);
    try {
      const inscricaoRef = doc(db, `eventos/${id}/inscricoes`, docId);

      // Se tem CPF, verifica se já existe registro prévio
      if (rawCpf.length === 11) {
        const snap = await getDoc(inscricaoRef);
        if (snap.exists()) {
          alert("Já existe um participante cadastrado com este CPF neste evento.");
          setSalvandoNovaInscricao(false);
          return;
        }
      }

      const nomeFormatado = formatarNome(novoForm.nome);
      const emailFormatado = novoForm.email.toLowerCase().trim();
      const telefoneNumeros = novoForm.telefone.replace(/\D/g, "");

      const dadosSalvar: any = {
        nome: nomeFormatado,
        email: emailFormatado,
        telefone: telefoneNumeros,
        institution: instituicaoFinal,
        dataInscricao: serverTimestamp(),
        attendances: [],
        certificateIssued: false,
      };

      if (novoForm.isMonitor) {
        dadosSalvar.isMonitor = true;
      }
      if (novoForm.isMinistrante) {
        dadosSalvar.isMinistrante = true;
      }
      if (rawCpf.length === 11) {
        dadosSalvar.cpf = rawCpf;
      }

      await setDoc(inscricaoRef, dadosSalvar);
      await updateDoc(doc(db, "eventos", id), {
        registrationsCount: increment(1),
      });

      alert("Inscrição cadastrada com sucesso!");

      const novoParticipante: ParticipanteData = {
        id: docId,
        cpf: rawCpf.length === 11 ? rawCpf : "",
        nome: nomeFormatado,
        email: emailFormatado,
        telefone: telefoneNumeros,
        institution: instituicaoFinal,
        dataInscricao: new Date(),
        isMonitor: novoForm.isMonitor,
        isMinistrante: novoForm.isMinistrante,
      };

      setParticipantes((prev) => [novoParticipante, ...prev]);

      setNovoForm({
        cpf: "",
        nome: "",
        email: "",
        telefone: "",
        institution: "UFDPar",
        outraInstituicao: "",
        isMonitor: false,
        isMinistrante: false,
      });
      setMostrarFormNovaInscricao(false);
    } catch (e) {
      console.error("Erro ao salvar inscrição manual:", e);
      alert(`Erro ao cadastrar inscrição manual: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSalvandoNovaInscricao(false);
    }
  }

  async function handleBaixarCertificadoAdmin(p: ParticipanteData) {
    if (!evento) return;
    try {
      const cpfExibicao = p.cpf && p.cpf.replace(/\D/g, "").length === 11 
        ? p.cpf.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        : (p.cpf || "—");

      await gerarPdfCertificado(evento, {
        nome: p.nome,
        cpf: cpfExibicao,
        isMonitor: p.isMonitor,
        isMinistrante: p.isMinistrante,
      });
    } catch (e) {
      console.error("Erro ao gerar certificado no admin:", e);
      alert("Erro ao gerar o PDF do certificado.");
    }
  }

  async function enviarLembretes() {
    if (!assuntoEmail || !mensagemEmail) {
      alert("Por favor, preencha o assunto e a mensagem do e-mail.");
      return;
    }

    if (!confirm(`Tem certeza que deseja enviar o e-mail para todos os ${participantes.length} inscritos de ${evento?.name}?`)) return;
    
    setEnviandoEmails(true);
    setProgressoEnvio("");
    try {
      // Filtrar participantes que realmente possuem um e-mail cadastrado
      // E IGNORAR e-mails falsos que causam bloqueio por Bounce no Gmail
      const emailsFalsos = ["sem@email.com", "teste@teste.com", "naotem@email.com"];
      const participantesValidos = participantes.filter(p => {
        if (!p.email || p.email.trim() === "") return false;
        if (emailsFalsos.includes(p.email.toLowerCase().trim())) return false;
        return true;
      });
      
      const TAMANHO_LOTE = 15;
      const totalLotes = Math.ceil(participantesValidos.length / TAMANHO_LOTE);

      for (let i = 0; i < totalLotes; i++) {
        const inicio = i * TAMANHO_LOTE;
        const fim = inicio + TAMANHO_LOTE;
        const lote = participantesValidos.slice(inicio, fim);

        // Opcional: Atualizar a tela mostrando o progresso via alert ou console
        setProgressoEnvio(`Enviando lote ${i + 1} de ${totalLotes}...`);
        console.log(`Enviando lote ${i + 1} de ${totalLotes} (${lote.length} participantes)...`);

        const response = await fetch('/api/lembretes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            participantes: lote.map(p => ({ nome: p.nome, email: p.email })),
            nomeEvento: evento?.name || "Nosso Evento",
            assunto: assuntoEmail,
            mensagemHtml: mensagemEmail.replace(/\n/g, '<br>')
          }),
        });

        if (!response.ok) throw new Error(`Erro na requisição do lote ${i + 1}`);

        // Pausa de 15 segundos entre os lotes (exceto após o último lote) para não engatilhar o anti-spam do Gmail
        if (i < totalLotes - 1) {
          setProgressoEnvio(`Pausa de segurança do Gmail (15s)... Aguarde.`);
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      alert("E-mails enviados com sucesso para todos os inscritos!");
      setMensagemEmail(""); // limpa o campo após enviar
      editor?.commands.setContent(""); // limpa o Tiptap visualmente
    } catch (e) {
      console.error(e);
      alert("Erro ao disparar os e-mails (pode ter falhado em algum lote). Verifique o console.");
    } finally {
      setEnviandoEmails(false);
      setProgressoEnvio("");
    }
  }

  async function testarEnvioEmail() {
    // É bom validar se você digitou algo antes de testar também
    if (!assuntoEmail || !mensagemEmail) {
      alert("Por favor, preencha o assunto e a mensagem do e-mail para testar.");
      return;
    }

    setEnviandoEmails(true);
    try {
      // Usando o e-mail que você definiu no seu trecho
      const emailTeste = "ricardo@riotechsistemas.com.br"; 

      const response = await fetch('/api/lembretes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // testing...
          participantes: [{ 
            nome: "Ricardo Melo (teste)", 
            email: emailTeste 
          }],
          // Enviando os dados da tela para a API:
          nomeEvento: evento?.name || "Nosso Evento",
          assunto: assuntoEmail,
          mensagemHtml: mensagemEmail.replace(/\n/g, '<br>') // Converte as quebras de linha
        }),
      });

      if (!response.ok) throw new Error("Erro na requisição de envio do teste");
      
      // Alerta ajustado para mostrar o e-mail correto
      alert(`E-mail de teste enviado com sucesso para ${emailTeste}!`);
    } catch (e) {
      console.error(e);
      alert("Erro ao disparar o e-mail de teste. Verifique o terminal.");
    } finally {
      setEnviandoEmails(false);
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

        <div className="linksInscritos">
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
            folha de assinaturas
          </Link>

          <Link
            href={`/eventos/admin/${id}/elegiveis-certificado`}
            className="linkImprimirElegiveis"
            target="_blank"
            rel="noopener noreferrer"
          >
            elegíveis para certificado
          </Link>

          <Link 
            href={`/eventos/admin/${id}/monitores`} 
            className="linkListarMonitores" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            listar monitores
          </Link>

          <button
            onClick={() => setMostrarFormNovaInscricao(!mostrarFormNovaInscricao)}
            className="btnCadastrarInscricao"
            type="button"
          >
            + Cadastrar Inscrição
          </button>

          <button
            onClick={() => setMostrarFormEmail(!mostrarFormEmail)}
            style={{
              background: "none",
              border: "1px solid #cccccc",
              color: "#0070f3",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 8,
              fontFamily: "inherit",
              fontSize: "inherit"
            }}
          >
            {mostrarFormEmail ? "fechar painel de e-mail" : "enviar e-mail aos inscritos"}
          </button>

        </div>
      </div>

      {/* --- Painel de Cadastro Manual de Inscrição --- */}
      {mostrarFormNovaInscricao && (
        <div style={{
          margin: "1.5rem auto",
          maxWidth: "1200px",
          padding: "1.5rem",
          backgroundColor: "#ffffff",
          border: "2px solid #3182ce",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.5rem", color: "#2c5282", fontSize: "1.25rem" }}>
            ➕ Cadastrar Nova Inscrição (Manual)
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#718096", marginBottom: "1.25rem" }}>
            Cadastre participantes que perderam o prazo ou precisam regularizar os dados. O CPF é <strong>opcional</strong> na área administrativa.
          </p>

          <form onSubmit={handleSalvarNovaInscricao} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.9rem" }}>
                  Nome Completo *:
                </label>
                <input
                  ref={nomeAdminInputRef}
                  type="text"
                  value={novoForm.nome}
                  onChange={(e) => setNovoForm(p => ({ ...p, nome: e.target.value }))}
                  onBlur={(e) => setNovoForm(p => ({ ...p, nome: formatarNome(e.target.value) }))}
                  required
                  placeholder="Nome do inscrito"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.9rem" }}>
                  E-mail *:
                </label>
                <input
                  type="email"
                  value={novoForm.email}
                  onChange={(e) => setNovoForm(p => ({ ...p, email: e.target.value.toLowerCase() }))}
                  required
                  placeholder="email@exemplo.com"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", boxSizing: "border-box", textTransform: "lowercase" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.9rem" }}>
                  CPF (Opcional):
                </label>
                <input
                  type="text"
                  value={novoForm.cpf}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
                      .slice(0, 14);
                    setNovoForm(p => ({ ...p, cpf: val }));
                  }}
                  maxLength={14}
                  placeholder="000.000.000-00 (Opcional)"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600", fontSize: "0.9rem" }}>
                  Telefone (Opcional):
                </label>
                <input
                  type="text"
                  value={novoForm.telefone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                      .replace(/^(\d{2})(\d)/, "($1) $2")
                      .replace(/(\d{5})(\d{4})$/, "$1-$2")
                      .slice(0, 15);
                    setNovoForm(p => ({ ...p, telefone: val }));
                  }}
                  maxLength={15}
                  placeholder="(99) 99999-9999"
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e0", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Instituição Radio Buttons */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "0.9rem" }}>
                Instituição:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                {["UFDPar", "UESPI", "IFPI", "Outra"].map((opcao) => (
                  <label key={opcao} style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem", padding: "6px 12px", border: "1px solid #cbd5e0", borderRadius: "6px", backgroundColor: novoForm.institution === opcao ? "#ebf8ff" : "#fff", fontWeight: novoForm.institution === opcao ? "600" : "normal" }}>
                    <input
                      type="radio"
                      name="adminInstituicao"
                      value={opcao}
                      checked={novoForm.institution === opcao}
                      onChange={(e) => setNovoForm(p => ({ ...p, institution: e.target.value }))}
                    />
                    {opcao}
                  </label>
                ))}
              </div>

              {novoForm.institution === "Outra" && (
                <div style={{ marginTop: "10px" }}>
                  <input
                    ref={outraAdminInputRef}
                    type="text"
                    value={novoForm.outraInstituicao}
                    onChange={(e) => setNovoForm(p => ({ ...p, outraInstituicao: e.target.value }))}
                    placeholder="Digite o nome da instituição"
                    required
                    style={{ width: "100%", maxWidth: "400px", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e0" }}
                  />
                </div>
              )}
            </div>

            {/* Monitor & Ministrante checkboxes */}
            <div style={{ display: "flex", gap: "16px", marginTop: "4px", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" }}>
                <input
                  id="adminIsMonitor"
                  type="checkbox"
                  checked={novoForm.isMonitor}
                  onChange={(e) => setNovoForm(p => ({ ...p, isMonitor: e.target.checked }))}
                />
                Cadastrar como Monitor
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" }}>
                <input
                  id="adminIsMinistrante"
                  type="checkbox"
                  checked={novoForm.isMinistrante}
                  onChange={(e) => setNovoForm(p => ({ ...p, isMinistrante: e.target.checked }))}
                />
                Cadastrar como Ministrante
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
              <button
                type="submit"
                disabled={salvandoNovaInscricao}
                style={{
                  backgroundColor: "#2b6cb0",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {salvandoNovaInscricao ? "Salvando..." : "Salvar Inscrição"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormNovaInscricao(false)}
                style={{
                  backgroundColor: "#e2e8f0",
                  color: "#4a5568",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarFormEmail && (
        <div style={{ 
          margin: "1rem auto", 
          maxWidth: "960px", 
          padding: "1rem", 
          backgroundColor: "#f9f9f9", 
          border: "1px solid #ddd", 
          borderRadius: "8px" 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem" }}>✉️ Enviar E-mail para Inscritos</h3>
          
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Assunto:</label>
          <input 
            type="text" 
            value={assuntoEmail}
            onChange={(e) => setAssuntoEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "1rem", borderRadius: "4px", border: "1px solid #ccc" }}
          />

          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Mensagem:</label>

          <div style={{ marginBottom: "1rem", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#fff" }}>
            {/* Barra de Ferramentas Simples */}
            {editor && (
              <div style={{ display: "flex", gap: "5px", padding: "8px", borderBottom: "1px solid #eaeaea", backgroundColor: "#f1f1f1", borderTopLeftRadius: "4px", borderTopRightRadius: "4px" }}>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  style={{ 
                    fontWeight: "bold", padding: "4px 8px", cursor: "pointer", 
                    backgroundColor: editor.isActive('bold') ? '#d1d5db' : '#fff',
                    border: "1px solid #ccc", borderRadius: "4px"
                  }}
                >
                  B
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  style={{ 
                    fontStyle: "italic", padding: "4px 8px", cursor: "pointer", 
                    backgroundColor: editor.isActive('italic') ? '#d1d5db' : '#fff',
                    border: "1px solid #ccc", borderRadius: "4px" 
                  }}
                >
                  I
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Pega o link atual caso o texto já tenha um link
                    const previousUrl = editor.getAttributes('link').href;
                    
                    // Abre a janelinha pedindo a URL
                    const url = window.prompt('Digite ou cole a URL do link:', previousUrl);

                    // Se você cancelar, não faz nada
                    if (url === null) {
                      return;
                    }

                    // Se você deixar em branco e der OK, ele remove o link existente
                    if (url === '') {
                      editor.chain().focus().extendMarkRange('link').unsetLink().run();
                      return;
                    }

                    // Se colocou um link válido, ele aplica no texto selecionado
                    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                  }}
                  style={{ 
                    padding: "4px 8px", cursor: "pointer", 
                    backgroundColor: editor.isActive('link') ? '#d1d5db' : '#fff',
                    border: "1px solid #ccc", borderRadius: "4px" 
                  }}
                  title="Adicionar Link"
                >
                  🔗
                </button>
              </div>
            )}

            {/* O Editor em Si */}
            <div style={{ minHeight: "150px", cursor: "text" }} onClick={() => editor?.commands.focus()}>
              <EditorContent editor={editor} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={testarEnvioEmail}
              disabled={enviandoEmails}
              style={{
                backgroundColor: enviandoEmails ? "#ccc" : "#f39c12",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: enviandoEmails ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
            >
              {enviandoEmails ? "Aguarde..." : "Testar (Somente para mim)"}
            </button>

            <button
              onClick={enviarLembretes}
              disabled={enviandoEmails || participantes.length === 0}
              style={{
                backgroundColor: enviandoEmails ? "#ccc" : "#28a745",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: enviandoEmails ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
            >
              {enviandoEmails ? (progressoEnvio || "Enviando para todos...") : `Disparar para todos (${participantes.length})`}
            </button>
          </div>
        </div>
      )}

      <div
        className="search-container"
        style={{ margin: "0.5rem auto", maxWidth: "960px" }}
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
            <th className="cpfColumn"> CPF </th>
            <th> Instituição </th>
            <th></th>
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
                    {p.isMinistrante && (
                      <span title="Ministrante">
                        <FontAwesomeIcon icon={faMicrophone} style={{ color: '#d69e2e', marginRight: '8px' }} />
                      </span>
                    )}
                    {p.isMonitor && (
                      <span title="Monitor/Organizador">
                        <FontAwesomeIcon icon={faUserShield} style={{ color: '#2962ff', marginRight: '8px' }} />
                      </span>
                    )}
                    <strong>{p.nome}</strong>
                  </td>
                  <td data-label="Email:"> {p.email} </td>
                  <td data-label="Telefone:"> {p.telefone || "—"} </td>
                  <td data-label="CPF:" className="cpfColumn"> {p.cpf && p.cpf.replace(/\D/g, "").length === 11 ? p.cpf.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : (p.cpf || "—")} </td>
                  <td data-label="Instituição:"> {p.institution || "—"} </td>
                  <td data-label="Ações:" className="actionsColumn">
                    <button
                      className="btnBaixarCertificadoAdmin"
                      title="Baixar Certificado PDF"
                      onClick={() => handleBaixarCertificadoAdmin(p)}
                    >
                      <FontAwesomeIcon icon={faCertificate} />
                    </button>
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
                      onClick={() => excluirParticipante(p.id)}
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
                        {/* checkbox monitores / ministrantes */}
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="isMonitor"
                            checked={form.isMonitor ?? false}
                            onChange={onChangeForm}
                          />
                          Monitor
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            name="isMinistrante"
                            checked={form.isMinistrante ?? false}
                            onChange={onChangeForm}
                          />
                          Ministrante
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

