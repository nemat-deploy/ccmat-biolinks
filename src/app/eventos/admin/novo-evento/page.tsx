"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link"; 

export default function NovoEventoPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params || {};

  const [eventoId, setEventoId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [prazoInscricao, setPrazoInscricao] = useState("");
  const [vagas, setVagas] = useState("30");
  const [status, setStatus] = useState("aberto");
  const [percentualMinimoCertificado, setPercentualMinimoCertificado] = useState("80");
  const [mensagem, setMensagem] = useState("");

  // Se for edição, carrega dados do evento
  useEffect(() => {
    async function fetchEvento() {
      if (!id) return;

      try {
        const eventoRef = doc(db, "eventos", id);
        const eventoSnap = await getDoc(eventoRef);

        if (eventoSnap.exists()) {
          const data = eventoSnap.data();

          setNome(data.name || "");
          setDescricao(data.description || "");

          setInicio(data.startDate?.toDate().toISOString().split("T")[0] || "");
          setFim(data.endDate?.toDate().toISOString().split("T")[0] || "");
          setPrazoInscricao(
            data.registrationDeadLine?.toDate().toISOString().split("T")[0] || ""
          );

          setVagas(String(data.maxParticipants || 30));
          setPercentualMinimoCertificado(
            String(data.minAttendancePercentForCertificate || 80)
          );
          setStatus(data.status || "aberto");
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err.message);
        setMensagem("❌ Erro ao carregar evento.");
      }
    }

    fetchEvento();
  }, [id]);

  // Salva evento
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim() || !descricao.trim() || !inicio || !fim || !prazoInscricao) {
      setMensagem("⚠️ Todos os campos são obrigatórios.");
      return;
    }

    try {
      const eventoRef = doc(db, "eventos", eventoId || nome.toLowerCase().replace(/\s+/g, "-"));

      await setDoc(eventoRef, {
        name: nome,
        description: descricao,
        startDate: Timestamp.fromDate(new Date(inicio + "T00:00:00")),
        endDate: Timestamp.fromDate(new Date(fim + "T23:59:59")),
        registrationDeadLine: Timestamp.fromDate(new Date(prazoInscricao + "T23:59:59")),
        maxParticipants: parseInt(vagas, 10),
        registrationsCount: 0,
        status,
        minAttendancePercentForCertificate: parseInt(percentualMinimoCertificado, 10)
      });

      setMensagem("✅ Evento salvo com sucesso!");
      setTimeout(() => {
        router.push("/eventos/admin");
      }, 1000);
    } catch (err) {
      console.error("Erro ao salvar evento:", err.message);
      setMensagem("❌ Erro ao salvar evento.");
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
                onChange={(e) => setEventoId(e.target.value)}
                required={!id}
                placeholder="ex: curso-latex"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem"
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
            Descrição:
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
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
            Data de início:
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
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
            Data de fim:
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
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
            Prazo de inscrição:
            <input
              type="date"
              value={prazoInscricao}
              onChange={(e) => setPrazoInscricao(e.target.value)}
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
            Máximo de vagas:
            <input
              type="number"
              value={vagas}
              onChange={(e) => setVagas(e.target.value)} // 👈 Agora é string
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
            Status:
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem"
              }}
            >
              <option value="aberto">Aberto</option>
              <option value="em andamento">Em andamento</option>
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
              onChange={(e) => setPercentualMinimoCertificado(e.target.value)}
              min="0"
              max="100"
              style={{
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem"
              }}
            />
          </label>
        </div>

        <button
          type="submit"
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