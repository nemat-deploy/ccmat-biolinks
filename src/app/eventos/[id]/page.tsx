"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parseTimestamp, formatarData } from "@/lib/utils";
import { Timestamp } from "firebase/firestore";
import "./page.css";

// // Função utilitária para converter valores em Date, está no arquivo lib/utils.ts
// function parseTimestamp(value: any): Date | null {
//   if (value instanceof Timestamp) {
//     return value.toDate();
//   } else if (value instanceof Date) {
//     return value;
//   } else if (typeof value === "string" || typeof value === "number") {
//     const date = new Date(value);
//     return isNaN(date.getTime()) ? null : date;
//   }
//   return null;
// }

type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  registrationDeadLine: Date;
  maxParticipants: number;
  registrationsCount: number;
  status: string;
  minAttendancePercentForCertificate: number;
};

export default function EventoPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [formEnviado, setFormEnviado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instituicao, setInstituicao] = useState("UFDPar");

  function validarCPF(cpf: string) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /(\d)\1{10}/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== Number(cpf[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === Number(cpf[10]);
  }

  function formatCpf(value: string): string {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
      .slice(0, 14);
  }

  function formatTelefone(value: string): string {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .slice(0, 15);
  }

useEffect(() => {
  async function fetchEvento() {
    if (!id) return;
    const eventoRef = doc(db, "eventos", id);
    const eventoSnap = await getDoc(eventoRef);
    if (eventoSnap.exists()) {
      const data = eventoSnap.data();

      // Parse das datas com fallback para new Date(0)
      const startDate = parseTimestamp(data.startDate) ?? new Date(0);
      const endDate = parseTimestamp(data.endDate) ?? new Date(0);
      const registrationDeadLine = parseTimestamp(data.registrationDeadLine) ?? new Date(0);

      setEvento({
        id: eventoSnap.id,
        name: data.name,
        description: data.description,
        startDate,
        endDate,
        registrationDeadLine,
        maxParticipants: data.maxParticipants ?? 0,
        registrationsCount: data.registrationsCount ?? 0,
        status: data.status || "aberto",
        minAttendancePercentForCertificate: data.minAttendancePercentForCertificate ?? 80,
      });
    }
    setLoading(false);
  }
  fetchEvento();
}, [id]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!evento) return;

    const hoje = new Date();
    if (evento.registrationDeadLine && evento.registrationDeadLine < hoje) {
      setMensagem("⚠️ Inscrições encerradas para esse evento.");
      return;
    }

    const cpfNumeros = cpf.replace(/\D/g, "");
    const telefoneNumeros = telefone.replace(/\D/g, "");

    if (!cpf || !validarCPF(cpfNumeros)) {
      setMensagem("⚠️ CPF inválido.");
      return;
    }

    try {
      const inscricaoRef = doc(
        collection(db, `eventos/${evento.id}/inscricoes`),
        cpfNumeros
      );
      const inscricaoSnap = await getDoc(inscricaoRef);

      if (inscricaoSnap.exists()) {
        setMensagem("⚠️ Você já está inscrito neste evento.");
        return;
      }

      await setDoc(inscricaoRef, {
        nome,
        email,
        telefone: telefoneNumeros,
        institution: instituicao,
        dataInscricao: new Date(),
        attendances: [],
        certificateIssued: false,
      });

      const eventoRef = doc(db, "eventos", evento.id);
      await updateDoc(eventoRef, {
        registrationsCount: increment(1),
      });

      setMensagem("✅ Inscrição realizada com sucesso!");
      setFormEnviado(true);
    } catch (error) {
      setMensagem("❌ Erro ao realizar inscrição.");
      console.error(error);
    }
  };

  if (loading) return <p>Carregando evento...</p>;
  if (!evento) return <p>Evento não encontrado.</p>;

  const hoje = new Date();
  const prazoEncerrado =
    evento.registrationDeadLine && evento.registrationDeadLine < hoje;

  return (
    <div className="container">
      <h1>{evento.name}</h1>
      <p>{evento.description}</p>
      <p>Início: {formatarData(evento.startDate)}</p>
      <p>Fim: {formatarData(evento.endDate)}</p>
      <p>Status: {evento.status}</p>

      {prazoEncerrado && (
        <p className="mensagem">⚠️ Inscrições encerradas para esse evento.</p>
      )}

      {!formEnviado && !prazoEncerrado ? (
        <form onSubmit={handleSubmit} className="form">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            required
          />
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="CPF"
            required
            maxLength={14}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            placeholder="Telefone"
            required
            maxLength={15}
          />
          <input
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            placeholder="Instituição"
          />
          <button type="submit">Enviar Inscrição</button>
        </form>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: mensagem }} />
      )}

      {!formEnviado && mensagem && <p>{mensagem}</p>}

      <Link href="/eventos"> Voltar para Eventos</Link>
    </div>
  );
}
