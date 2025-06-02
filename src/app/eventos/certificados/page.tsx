// src/app/eventos/certificados/page.tsx
"use client";

import { useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "./page.css";

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

export default function CertificadosPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    nome: string;
    eventos: {
      id: string;
      nome: string;
      nomeInscrito: string;
      emailInscrito: string;
      dataInscricao: Date | null;
      presencas: number;
      totalSessoes: number;
      percentual: number;
      certificado: boolean;
    }[];
  } | null>(null);
  const [error, setError] = useState("");

  const buscarCertificados = async () => {
    const rawCpf = cpf.replace(/\D/g, "");
    if (!validarCPF(rawCpf)) {
      setError("CPF inválido");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 1. Busca todos os eventos
      const eventosSnapshot = await getDocs(collection(db, "eventos"));
      const eventosComInscricao = [];

      // 2. Para cada evento, verifica se o CPF está inscrito
      for (const eventoDoc of eventosSnapshot.docs) {
        const inscricaoRef = doc(db, "eventos", eventoDoc.id, "inscricoes", rawCpf);
        const inscricaoSnap = await getDoc(inscricaoRef);

        if (inscricaoSnap.exists()) {
          const eventoData = eventoDoc.data();
          const inscricaoData = inscricaoSnap.data();
          
          const minPresenca = eventoData.minAttendancePercentForCertificate || 80;
          const totalSessoes = eventoData.totalSessoes || 1;
          const presencas = inscricaoData.attendances?.length || 0;
          const percentual = Math.round((presencas / totalSessoes) * 100);

          eventosComInscricao.push({
            id: eventoDoc.id,
            nome: eventoData.name,
            nomeInscrito: inscricaoData.nome, // Nome digitado na inscrição
            emailInscrito: inscricaoData.email, // Email digitado
            presencas,
            totalSessoes,
            percentual,
            certificado: percentual >= minPresenca,
            dataInscricao: inscricaoData.dataInscricao?.toDate?.() || null // Data formatada
          });
        }
      }

      if (eventosComInscricao.length === 0) {
        setError("Nenhuma inscrição encontrada para este CPF");
      } else {
        // obtendo o nome do primeiro documento de inscrição (todos devem ter o mesmo nome)
        const primeiroInscricao = await getDoc(doc(db, "eventos", eventosComInscricao[0].id, "inscricoes", rawCpf));
        setResult({
          nome: primeiroInscricao.data()?.nome || "Participante",
          eventos: eventosComInscricao
        });
      }
    } catch (err) {
      console.error("Erro na consulta:", err);
      setError("Erro ao buscar certificados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Consulte se você receberá certificado</h1>
      
      <div className="input-group">
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value.replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            .slice(0, 14))}
          placeholder="Digite seu CPF"
          maxLength={14}
        />
        <button onClick={buscarCertificados} disabled={loading || !cpf}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

{result && (
  <div className="resultado">
    <h2>Certificados que serão disponibilizados:</h2>
    
    <div className="eventos-grid">
      {result.eventos.map((evento) => (
        <div key={evento.id} className="evento-card">
          <h3>{evento.nome}</h3>
          
          <div className="info-group">
            <h4>Dados da Inscrição:</h4>
            <p><strong>Nome:</strong> {evento.nomeInscrito}</p>
            <p><strong>Email:</strong> {evento.emailInscrito}</p>
            {/*<p><strong>Data de inscrição:</strong> {evento.dataInscricao?.toLocaleDateString?.() || 'Não informada'}</p>*/}
          </div>

          <div className="info-group">
{/*            <h4>Frequência:</h4>
            <p><strong>Presenças:</strong> {evento.presencas}/{evento.totalSessoes}</p>
            <p><strong>Percentual:</strong> {evento.percentual}%</p>*/}
            <strong style={{ color: 'black' }}>Certificado: </strong>
            <span className={evento.certificado ? "success" : "warning"}>
              {evento.certificado ? "✅ Sim" : "❌ Não"}
            </span>
          </div>

          {evento.nomeInscrito !== result.eventos[0].nomeInscrito && (
            <p className="discrepancy-warning">
              ⚠️ O nome nesta inscrição difere do seu nome principal
            </p>
          )}
        </div>
      ))}
    </div>

    <div className="contact-info">
      <h3>Encontrou erros?</h3>
      <p>Entre em contato com a organização: <br /> <strong>nemat.ufdpar@gmail.com</strong></p>
    </div>
  </div>
)}
    </div>
  );
}