"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import "./page.css";

// Tipagem para os dados do evento
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

  // Extrai ID do evento da URL
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

  // Se for edição, carrega os dados do evento
  useEffect(() => {
    async function fetchEvento() {
      if (typeof id !== "string") {
        setMensagem("⚠️ ID do evento inválido.");
        return;
      }

      try {
        const eventoRef = doc(db, "eventos", id);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
          const data = eventoSnap.data();

          // Função auxiliar pra converter Timestamp ou Date pra string ISO (input date)
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
        let errorMessage = "Erro desconhecido";
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "object" && err !== null && "message" in err) {
          errorMessage = String((err as { message?: string }).message);
        }

        console.error("Erro ao carregar evento:", errorMessage);
        setMensagem(`❌ Erro ao carregar evento: ${errorMessage}`);
      }
    }

    if (id) fetchEvento();
  }, [id]);

  // Função de envio do formulário com tipagem correta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!nome.trim() || !descricao.trim() || !inicio || !fim || !prazoInscricao) {
      setMensagem("⚠️ Todos os campos são obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      const eventId = eventoId || nome.toLowerCase().replace(/\s+/g, "-");

      const eventoRef = doc(db, "eventos", eventId);

      const startDate = new Date(inicio + "T00:00:00");
      const endDate = new Date(fim + "T23:59:59");
      const registrationDeadline = new Date(prazoInscricao + "T23:59:59");

      await setDoc(eventoRef, {
        name: nome,
        description: descricao,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        registrationDeadLine: Timestamp.fromDate(registrationDeadline),
        maxParticipants: parseInt(vagas, 10) || 0,
        registrationsCount: 0,
        status: status,
        minAttendancePercentForCertificate: parseInt(percentualMinimoCertificado, 10) || 80
      });

      setMensagem("✅ Evento salvo com sucesso!");
      setTimeout(() => {
        router.push("/eventos/admin");
      }, 1000);
    } catch (error) {
      let errorMessage = "Erro desconhecido";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String((error as { message?: string }).message);
      }

      console.error("Erro ao salvar evento:", errorMessage);
      setMensagem(`❌ Erro ao salvar evento: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>{id ? "Editar Evento" : "Novo Evento"}</h1>
      {mensagem && <p>{mensagem}</p>}

      <form onSubmit={handleSubmit}>
        {!id && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              ID do evento (usado na URL):
              <input
                type="text"
                value={eventoId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEventoId(e.target.value)
                }
                required={!id}
                placeholder="ex: curso-latex"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px"
                }}
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Nome do evento:
            <input
              type="text"
              value={nome}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNome(e.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Descrição:
            <textarea
              value={descricao}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescricao(e.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Data de início:
            <input
              type="date"
              value={inicio}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInicio(e.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Data de fim:
            <input
              type="date"
              value={fim}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFim(e.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Prazo de inscrição:
            <input
              type="date"
              value={prazoInscricao}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPrazoInscricao(e.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Máximo de vagas:
            <input
              type="number"
              value={vagas}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setVagas(e.target.value)
              }
              required
              min="0"
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Status:
            <select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatus(e.target.value as Evento["status"])
              }
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            >
              <option value="aberto">Aberto</option>
              <option value="em andamento">Em andamento</option>
              <option value="em breve">Em breve</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block" }}>
            Percentual mínimo de presença para certificado (%):
            <input
              type="number"
              value={percentualMinimoCertificado}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPercentualMinimoCertificado(e.target.value)
              }
              min="0"
              max="100"
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
                border: "1px solid #ccc",
                borderRadius: "4px"
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#0070f3",
            color: "white",
            border: "none",
            padding: "0.6rem 1rem",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {id ? "Atualizar evento" : "Criar evento"}
        </button>

        {id && (
          <button
            type="button"
            onClick={() => {}}
            style={{
              marginLeft: "1rem",
              background: "red",
              color: "white",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Excluir evento
          </button>
        )}
      </form>

      <br />
      <Link href="/eventos/admin" style={{ color: "#0070f3" }}>
        ← Voltar para eventos
      </Link>
    </div>
  );
}