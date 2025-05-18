"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { increment } from "firebase/firestore";
import { Timestamp } from "firebase/firestore"

type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationDeadLine: Date | null;
  maxParticipants: number;
  registrationsCount: number;
  status: "aberto" | "encerrado" | "em andamento" | "em breve";
  minAttendancePercentForCertificate: number;
};

export default function EventoPage() {
  const params = useParams();
  const { id } = params;
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [formEnviado, setFormEnviado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Campos do formulário
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instituicao, setInstituicao] = useState("UFDPar");

  type TimestampValue = {
    timestampValue?: string;
  };

  // Função segura pra converter Timestamp ou string em Date
function parseTimestamp(
  value: Date | Timestamp | string | TimestampValue | null | undefined
): Date | null {
  if (!value) {
    console.warn("Campo vazio ou nulo:", value);
    return null;
  }

  // Se for objeto Date já válido
  if (value instanceof Date) {
    return value;
  }

  // Se for Firebase Timestamp
  if ((value as any)?.toDate && typeof (value as any).toDate === "function") {
    return (value as any).toDate();
  }

  // Se for objeto com timestampValue (vindo da API REST)
  if (typeof value === "object" && "timestampValue" in value && value.timestampValue) {
    return new Date(value.timestampValue);
  }

  // Se for string ISO ("2025-04-04T22:00:00Z")
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Caso padrão
  return null;
}

/**
 * Verifica se as inscrições estão abertas para um evento
 * @param evento - Objeto com dados do evento
 * @returns boolean
 */
function inscricoesAbertas(evento: Evento): boolean {
  if (!evento) return false;

  const hoje = new Date();
  const deadline = parseTimestamp(evento.registrationDeadLine);
  const prazoExpirado = deadline ? deadline < hoje : false;
  const eventoLotado =
    evento.maxParticipants > 0 &&
    evento.registrationsCount >= evento.maxParticipants;

  console.log("Debug - Status atual:", {
    status: evento.status,
    prazoExpirado,
    eventoLotado,
    deadline: deadline?.toISOString(),
    hoje: hoje.toISOString()
  });

  if (evento.status === "encerrado") return false;
  if (prazoExpirado) return false;
  if (eventoLotado) return false;

  // ✅ Se status for "aberto", "em andamento" ou "em breve", permite inscrição
  if (["aberto", "em andamento", "em breve"].includes(evento.status)) {
    return true;
  }

  return false;
}

  // Carrega evento do Firestore
  useEffect(() => {
    async function fetchEvento() {
      try {
        const eventoRef = doc(db, "eventos", id as string);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
          const data = eventoSnap.data();
          console.log("Dados brutos do evento:", data); // Verifique aqui se startDate e endDate estão corretos

          const startDate = parseTimestamp(data.startDate);
          const endDate = parseTimestamp(data.endDate);
          const registrationDeadLine = parseTimestamp(data.registrationDeadLine);

          const eventoData = {
            id: eventoSnap.id,
            name: data.name || "",
            description: data.description || "",
            startDate,
            endDate,
            registrationDeadLine,
            maxParticipants: data.maxParticipants || 0,
            registrationsCount: data.registrationsCount || 0,
            status: data.status || "aberto",
            minAttendancePercentForCertificate: data.minAttendancePercentForCertificate || 80
          };

          console.log("Debug - Dados crus:", {
            name: data.name,
            registrationDeadLine: data.registrationDeadLine,
            status: data.status,
            maxParticipants: data.maxParticipants,
            registrationsCount: data.registrationsCount
          });

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

          setEvento(eventoData);
        } else {
          setErro("❌ Evento não encontrado.");
        }
      } catch (err) {
        let errorMessage = "Erro desconhecido";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        } else if (err && typeof err === "object" && "message" in err) {
          errorMessage = String(err.message);
        }

        console.error("Erro ao buscar evento:", errorMessage);
        setErro("❌ Erro ao carregar evento.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvento();
  }, [id]);

  // Formata CPF e telefone
  function formatCpf(value: string): string {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }

  function formatTelefone(value: string): string {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2");
  }

  // Envia inscrição
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!evento) {
      setMensagem("⚠️ Nenhum evento carregado.");
      return;
    }

    if (evento.status === "encerrado") {
      setMensagem("⚠️ As inscrições estão encerradas.");
      return;
    }

    if (!cpf || !nome || !email || !telefone) {
      setMensagem("⚠️ Todos os campos são obrigatórios.");
      return;
    }

    try {
      const cpfNumeros = cpf.replace(/\D/g, "");
      const telefoneNumeros = telefone.replace(/\D/g, "");

      // Verifica se o CPF já está inscrito
      const participanteRef = doc(db, "participantes", cpfNumeros);
      const participanteSnap = await getDoc(participanteRef);

      if (participanteSnap.exists()) {
        setMensagem("⚠️ Este CPF já está inscrito.");
        return;
      }

      // Cria novo participante
      await setDoc(participanteRef, {
        nome,
        email,
        telefone: telefoneNumeros,
        institution: instituicao,
        eventoId: evento.id,
        dataInscricao: new Date(),
        attendances: [],
        certificateIssued: false
      });

      // Atualiza contador de inscrições (usando increment)
      const eventoRef = doc(db, "eventos", evento.id);
      await updateDoc(eventoRef, {
        registrationsCount: increment(1)
      });

      setMensagem("✅ Inscrição realizada com sucesso!");
      setFormEnviado(true);
      
    } catch (error) {
      console.error("Erro detalhado na inscrição:", {
        error: error,
        message: error.message,
        stack: error.stack
      });
      setMensagem(`❌ Erro: ${error.message || "Tente novamente mais tarde."}`);
    }
  };

  if (loading) return <p>Carregando evento...</p>;
  if (!evento) return <p style={{ color: "red" }}>{erro}</p>;

  const hoje = new Date();
  const prazoExpirado =
    evento.registrationDeadLine &&
    parseTimestamp(evento.registrationDeadLine) < hoje;
  const eventoLotado =
    evento.maxParticipants &&
    evento.registrationsCount >= evento.maxParticipants;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>{evento.name}</h1>
      <p>{evento.description}</p>

      <p><strong>Início:</strong> {evento.startDate?.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</p>
      <p><strong>Fim:</strong> {evento.endDate?.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</p>
      <p><strong>Status:</strong> {evento.status}</p>

      {/* Vagas */}
      {evento.maxParticipants > 0 && (
        <p><strong>Inscritos / Vagas:</strong> {evento.registrationsCount} / {evento.maxParticipants}</p>
      )}

      {/* Mensagem de evento lotado */}
      {eventoLotado && (
        <p style={{ color: "orange", fontWeight: "bold", marginTop: "1rem" }}>
          ⚠️ Este evento está lotado!
        </p>
      )}

      {/* Mensagem de prazo expirado */}
      {prazoExpirado && (
        <p style={{ color: "red", fontWeight: "bold", marginTop: "1rem" }}>
          ⚠️ O prazo de inscrição terminou.
        </p>
      )}

      {/* Formulário ou aviso */}
      {!formEnviado && inscricoesAbertas(evento) ? (
        <form onSubmit={handleSubmit} style={{ marginTop: "2rem", border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
          <h2>Formulário de Inscrição</h2>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              Nome:
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              CPF:
              <input
                type="text"
                value={formatCpf(cpf)}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              Telefone:
              <input
                type="tel"
                value={formatTelefone(telefone)}
                onChange={(e) => setTelefone(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
                }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block" }}>
              Instituição:
              <input
                type="text"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
                }}
              />
            </label>
          </div>

          {mensagem && (
            <p style={{ color: "green", marginBottom: "1rem" }}>{mensagem}</p>
          )}

          <button
            type="submit"
            style={{
              background: "#0070f3",
              color: "white",
              border: "none",
              padding: "0.8rem 1.2rem",
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            Enviar Inscrição
          </button>
        </form>
      ) : (
        <>
          {!formEnviado && (
            <p style={{ color: "red", marginTop: "1rem" }}>
              {evento.status === "encerrado"
                ? "⚠️ As inscrições estão encerradas."
                : prazoExpirado
                ? "⚠️ O prazo de inscrição terminou."
                : eventoLotado
                ? "⚠️ Este evento está lotado!"
                : "⚠️ Inscrições temporariamente indisponíveis."}
            </p>
          )}
        </>
      )}

      {/* Botão pra nova inscrição */}
      {formEnviado && (
        <div style={{ marginTop: "2rem" }}>
          <button
            onClick={() => {
              setFormEnviado(false);
              setCpf("");
              setNome("");
              setEmail("");
              setTelefone("");
            }}
            style={{
              background: "#0070f3",
              color: "white",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Fazer nova inscrição
          </button>
        </div>
      )}

      <br />
      <Link href="/eventos" style={{ color: "#0070f3" }}>
        ← Voltar para lista de eventos
      </Link>
    </div>
  );
}