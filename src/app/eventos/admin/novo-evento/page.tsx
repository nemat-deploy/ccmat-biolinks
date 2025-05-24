// src/app/eventos/admin/novo-evento/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
// import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import "./page.css";
import type { User } from "firebase/auth";

type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationDeadLine: Date | null;
  maxParticipants: number;
  registrationsCount: number;
  status: "aberto" | "encerrado" | "em breve" | "em andamento";
  minAttendancePercentForCertificate: number;
};

export default function NovoEventoPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};

  // Estados do formulário
  const [eventoId, setEventoId] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [prazoInscricao, setPrazoInscricao] = useState<string>("");
  const [vagas, setVagas] = useState<string>("30");
  const [status, setStatus] = useState<Evento["status"]>("aberto");
  const [percentualMinimoCertificado, setPercentualMinimoCertificado] = useState<string>("80");
  const [mensagem, setMensagem] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [slugExists, setSlugExists] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

// Verifica autenticação e permissões
useEffect(() => {
  // Solução com dynamic import para garantir compatibilidade
  import("firebase/auth").then(({ getAuth, onAuthStateChanged }) => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/eventos/login");
        return;
      }

      // Verifica se é admin
      const adminEmails = [
        "ricardomelo.rt@gmail.com",
        "andrielmo.silva@ufdpar.edu.br", 
        "nemat.ufdpar@gmail.com"
      ];
      
      if (user.email && adminEmails.includes(user.email)) {
        setIsAdmin(true);
      } else {
        setMensagem("❌ Acesso restrito a administradores");
        router.push("/eventos/admin");
      }
    });

    return () => unsubscribe();
  }).catch(error => {
    console.error("Erro ao carregar módulo de autenticação:", error);
    setMensagem("❌ Erro ao verificar autenticação");
  });
}, [router]);

  // Verifica se slug já existe
  const checkSlugExists = async (slug: string) => {
    if (!slug) return false;
    try {
      const eventoRef = doc(db, "eventos", slug);
      const eventoSnap = await getDoc(eventoRef);
      setSlugExists(eventoSnap.exists());
      return eventoSnap.exists();
    } catch (error) {
      console.error("Erro ao verificar slug:", error);
      return false;
    }
  };

  // Atualiza verificação de slug quando eventoId muda
  useEffect(() => {
    if (eventoId && !id) {
      checkSlugExists(eventoId);
    }
  }, [eventoId, id]);

  // Carrega dados do evento se for edição
  useEffect(() => {
    async function fetchEvento() {
      if (typeof id !== "string") return;

      try {
        setLoading(true);
        const eventoRef = doc(db, "eventos", id);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
          const data = eventoSnap.data();
          const toDateInputValue = (value: any): string => {
            if (!value) return "";
            if (value?.toDate) return value.toDate().toISOString().split("T")[0];
            if (value instanceof Date) return value.toISOString().split("T")[0];
            if (typeof value === "string") {
              const parsed = new Date(value);
              return isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
            }
            return "";
          };

          setEventoId(id);
          setNome(data.name || "");
          setDescricao(data.description || "");
          setInicio(toDateInputValue(data.startDate));
          setFim(toDateInputValue(data.endDate));
          setPrazoInscricao(toDateInputValue(data.registrationDeadLine));
          setVagas(String(data.maxParticipants ?? 30));
          setPercentualMinimoCertificado(String(data.minAttendancePercentForCertificate ?? 80));
          setStatus(data.status || "aberto");
        } else {
          setMensagem("❌ Evento não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setMensagem(`❌ Erro ao carregar evento: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchEvento();
  }, [id]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMensagem("");

  try {
    // 1. Validação dos campos obrigatórios
    const camposObrigatorios = [
      { valor: nome.trim(), nome: "Nome" },
      { valor: descricao.trim(), nome: "Descrição" },
      { valor: inicio, nome: "Data de início" },
      { valor: fim, nome: "Data de fim" },
      { valor: prazoInscricao, nome: "Prazo de inscrição" }
    ];

    const campoFaltante = camposObrigatorios.find(campo => !campo.valor);
    if (campoFaltante) {
      throw new Error(`⚠️ O campo "${campoFaltante.nome}" é obrigatório.`);
    }

    // 2. Processamento das datas
    const startDate = new Date(`${inicio}T00:00:00`);
    const endDate = new Date(`${fim}T23:59:59`);
    const registrationDeadline = new Date(`${prazoInscricao}T23:59:59`);

    // 3. Validação das datas
    if (startDate > endDate) {
      throw new Error("⚠️ Data de início não pode ser após a data de fim.");
    }

    if (registrationDeadline > endDate) {
      throw new Error("⚠️ Prazo de inscrição não pode ser após o fim do evento.");
    }

    // 4. Verificação de autenticação
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user?.email) {
      throw new Error("⚠️ Você precisa estar logado para realizar esta ação.");
    }

    // 5. Criação do ID do evento (slug)
    const eventId = eventoId || nome.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // 6. Verificação de slug duplicado (apenas para novos eventos)
    if (!id && (await checkSlugExists(eventId))) {
      throw new Error("⚠️ Esse endereço já está em uso. Por favor, escolha outro.");
    }

    // 7. Preparação dos dados do evento
    const dadosEvento = {
      name: nome.trim(),
      description: descricao.trim(),
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      registrationDeadLine: Timestamp.fromDate(registrationDeadline),
      maxParticipants: Number(vagas) || 0,
      status,
      minAttendancePercentForCertificate: Number(percentualMinimoCertificado) || 80,
      lastUpdatedBy: user.email,
      lastUpdatedAt: Timestamp.now(),
      ...(!id && {
        registrationsCount: 0,
        createdBy: user.email,
        createdAt: Timestamp.now()
      })
    };

    // 8. Salvamento no Firestore
    const eventoRef = doc(db, "eventos", eventId);
    await setDoc(eventoRef, dadosEvento, { merge: true });

    // 9. Feedback e redirecionamento
    setMensagem("✅ Evento salvo com sucesso!");
    setTimeout(() => router.push("/eventos/admin"), 1500);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao salvar evento:", error);
    setMensagem(errorMessage.startsWith("⚠️") ? errorMessage : `❌ ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};

  if (loading) return <div className="loading">Carregando...</div>;
  if (!isAdmin) return <div className="loading">Verificando permissões...</div>;

  return (
    <div className="container">
      <h1>{id ? "Editar Evento" : "Novo Evento"}</h1>
      
      {mensagem && (
        <div className={`message ${mensagem.includes("✅") ? "success" : "error"}`}>
          {mensagem}
        </div>
      )}

      <form onSubmit={handleSubmit} className="event-form">
        {!id && (
          <div className="form-group">
            <label>
              ID do evento (usado na URL):
              <input
                type="text"
                value={eventoId}
                onChange={(e) => {
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  setEventoId(value);
                }}
                required
                placeholder="ex: curso-latex"
                className="form-input"
              />
              {slugExists && (
                <p className="slug-error">Esse endereço já existe, escolha outro.</p>
              )}
            </label>
          </div>
        )}

        <div className="form-group">
          <label>
            Nome do evento:
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="form-input"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Descrição:
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="form-input"
              rows={4}
            />
          </label>
        </div>

        <div className="date-grid">
          <div className="form-group">
            <label>
              Data de início:
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                required
                className="form-input"
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Data de fim:
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                required
                className="form-input"
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Prazo de inscrição:
              <input
                type="date"
                value={prazoInscricao}
                onChange={(e) => setPrazoInscricao(e.target.value)}
                required
                className="form-input"
              />
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>
            Máximo de vagas:
            <input
              type="number"
              value={vagas}
              onChange={(e) => setVagas(e.target.value)}
              required
              min="0"
              className="form-input"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Status:
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Evento["status"])}
              className="form-input"
            >
              <option value="aberto">Aberto</option>
              <option value="em breve">Em breve</option>
              <option value="em andamento">Em andamento</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </label>
        </div>

        <div className="form-group">
          <label>
            Percentual mínimo de presença para certificado (%):
            <input
              type="number"
              value={percentualMinimoCertificado}
              onChange={(e) => setPercentualMinimoCertificado(e.target.value)}
              min="0"
              max="100"
              className="form-input"
            />
          </label>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? "Salvando..." : (id ? "Atualizar evento" : "Criar evento")}
          </button>

          <Link href="/eventos/admin" className="cancel-button">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}