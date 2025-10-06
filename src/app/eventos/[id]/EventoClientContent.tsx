"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  serverTimestamp,
  DocumentReference,
  onSnapshot
} from "firebase/firestore";
import "./page.css";
import Link from "next/link";
import { Inscricao } from "@/types";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { formatarData } from "@/lib/utils";
import LoadingMessage from "@/app/components/LoadingMessage";

// O tipo agora precisa lidar com Datas que podem vir como string
type Evento = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadLine: Date;
  maxParticipants: number;
  registrationsCount: number;
  status: string;
  minAttendancePercentForCertificate: number;
};

// Componente de Cliente que recebe os dados iniciais via props
export default function EventoClientContent({ initialEvento }: { initialEvento: any }) {
  // Converte as datas de string (recebidas do servidor) para objetos Date
  const eventoComDatas = {
      ...initialEvento,
      startDate: new Date(initialEvento.startDate),
      endDate: new Date(initialEvento.endDate),
      registrationDeadLine: new Date(initialEvento.registrationDeadLine),
  };
  
  const [evento, setEvento] = useState<Evento | null>(eventoComDatas);
  const [formEnviado, setFormEnviado] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instituicao, setInstituicao] = useState("UFDPar");

  // Funções de validação e formatação (exatamente como as suas)
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

  // Este useEffect agora serve para atualizações em tempo real PÓS carregamento inicial
  useEffect(() => {
    if (!evento?.id) return;

    const eventoRef = doc(db, "eventos", evento.id);
    const unsubscribe = onSnapshot(eventoRef, (eventoSnap) => {
      if (eventoSnap.exists()) {
        const data = eventoSnap.data();
        setEvento(prevEvento => ({
          ...prevEvento!,
          registrationsCount: data.registrationsCount ?? prevEvento!.registrationsCount,
          status: data.status || prevEvento!.status,
        }));
      }
    });
    return () => unsubscribe();
  }, [evento?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!evento) return;

    const hoje = new Date();
    if (evento.registrationDeadLine && evento.registrationDeadLine < hoje) {
      setMensagem("⚠️ Inscrições encerradas para esse evento.");
      return;
    }
    
    if (evento.status === "fechado") {
      setMensagem("⚠️ Inscrições estão temporariamente fechadas pela organização.");
      return;
    }

    const cpfNumeros = cpf.replace(/\D/g, "");
    if (!cpf || !validarCPF(cpfNumeros)) {
      setMensagem("⚠️ CPF inválido.");
      return;
    }

    const telefoneNumeros = telefone.replace(/\D/g, "");

    try {
      const inscricaoRef = doc(collection(db, `eventos/${evento.id}/inscricoes`), cpfNumeros);
      const inscricaoSnap = await getDoc(inscricaoRef as DocumentReference<Inscricao>);

      if (inscricaoSnap.exists()) {
        setMensagem("⚠️ Você já está inscrito neste evento.");
        return;
      }

      await setDoc(inscricaoRef, {
        nome,
        email,
        telefone: telefoneNumeros,
        institution: instituicao,
        dataInscricao: serverTimestamp(),
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
      console.error("Erro ao salvar inscrição:", error);
    }
  };

  if (!evento) return <p className="loadingEvents">Evento não encontrado.</p>;

  const hoje = new Date();
  const prazoEncerrado = evento.registrationDeadLine && evento.registrationDeadLine < hoje;
  const eventoLotado = evento.maxParticipants > 0 && evento.registrationsCount >= evento.maxParticipants;
  const statusFechado = evento.status === "fechado";

  // O restante do seu JSX é exatamente o mesmo
  return (
    <div className="container">
      <div className="event-header">
        {evento.imageUrl && (
          <img src={evento.imageUrl} alt={`Banner do evento ${evento.name}`} className="event-image-header" />
        )}
        <h1>{evento.name}</h1>
      </div>

      <div 
        className="event-description-content"
        dangerouslySetInnerHTML={{ __html: evento.description }} 
      />
      
      <p><strong>Início:</strong> {formatarData(evento.startDate)}<br />
      <strong>Fim:</strong> {formatarData(evento.endDate)}</p>
      <p><strong>
        <span className={`eventoStatus status-${evento.status}`}>
          Evento {evento.status}
        </span>
      </strong></p>

      {(evento.contactEmail || evento.contactPhone) && (
        <div className="event-contact-info">
          <h4>Dúvidas sobre o evento?</h4>
          <p>Entre em contato com a organização:</p>
          {evento.contactEmail && <p><strong>Email:</strong> {evento.contactEmail}</p>}
          {evento.contactPhone && <p><strong>Telefone:</strong> {evento.contactPhone}</p>}
        </div>
      )}

      {prazoEncerrado && <p className="mensagem">⚠️ Inscrições encerradas.</p>}
      {eventoLotado && <p className="mensagem">⚠️ Vagas esgotadas.</p>}
      {statusFechado && <p className="mensagem">⚠️ Inscrições estão temporariamente fechadas pela organização.</p>}

      {!(prazoEncerrado || eventoLotado || statusFechado) && (
        <h3 className="section-title">Faça sua inscrição</h3>
      )}

      {!formEnviado && !prazoEncerrado && !eventoLotado && !statusFechado ? (
        <form onSubmit={handleSubmit} className="form">
          <div className="form-floating">
            <input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder=" " autoFocus />
            <label htmlFor="nome">Nome</label>
          </div>
          <div className="form-floating">
            <input id="cpf" type="text" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} required maxLength={14} placeholder=" " />
            <label htmlFor="cpf">CPF</label>
          </div>
          <div className="form-floating">
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " />
            <label htmlFor="email">Email</label>
          </div>
          <div className="form-floating">
            <input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(formatTelefone(e.target.value))} required maxLength={15} placeholder=" " />
            <label htmlFor="telefone">Telefone</label>
          </div>
          <div className="form-floating">
            <input id="instituicao" type="text" value={instituicao} onChange={(e) => setInstituicao(e.target.value)} placeholder=" " />
            <label htmlFor="instituicao">Instituição</label>
          </div>
          <button type="submit">Enviar Inscrição</button>
        </form>
      ) : formEnviado ? ( 
        <div className="success-container">
          <p className="success-message">✅ Inscrição realizada com sucesso!</p>
          {!(eventoLotado || statusFechado) && (
            <button 
              className="new-registration-btn"
              onClick={() => {
                setFormEnviado(false);
                setMensagem("");
                setCpf("");
                setNome("");
                setTelefone("");
              }}
            >
              Nova Inscrição
            </button>
          )}
        </div>
      ) : ( 
        !prazoEncerrado && !eventoLotado && !statusFechado && (
          <p className="error-message">{mensagem}</p>
        )
      )}
      
    </div>
  );
}