// src/app/eventos/minhas-inscricoes/page.tsx
"use client";

import { useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Evento } from "@/types";
import { parseTimestamp } from "@/lib/utils";
import { gerarPdfCertificado } from "@/lib/generateCertificate";
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

function formatarCpfExibicao(cpfRaw: string): string {
  const clean = cpfRaw.replace(/\D/g, "");
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function MinhasInscricoesPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    nome: string;
    eventos: {
      id: string;
      nome: string;
      nomeInscrito: string;
      emailInscrito: string;
      contactEmail?: string;
      contactPhone?: string;
      dataInscricao: Date | null;
      presencas: number;
      totalSessoes: number;
      percentual: number;
      certificado: boolean;
      eventoDataRaw: any;
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
      const eventosSnapshot = await getDocs(collection(db, "eventos"));
      const eventosComInscricao = [];

      for (const eventoDoc of eventosSnapshot.docs) {
        const inscricaoRef = doc(db, "eventos", eventoDoc.id, "inscricoes", rawCpf);
        const inscricaoSnap = await getDoc(inscricaoRef);

        if (inscricaoSnap.exists()) {
          const eventoData = eventoDoc.data();
          const inscricaoData = inscricaoSnap.data();
          
          const minPresenca = eventoData.minAttendancePercentForCertificate || 80;
          const totalSessoes = eventoData.totalSessoes || 1;
          const presencas = inscricaoData.attendances?.length || 0;
          const percentual = totalSessoes > 0 ? Math.round((presencas / totalSessoes) * 100) : 0;
          const requerAtividadeFinal = eventoData?.requer_atividade_final === true;
          const enviouAtividadeFinal = Boolean(inscricaoData.enviou_atividade_final);

          eventosComInscricao.push({
            id: eventoDoc.id,
            nome: eventoData.name,
            nomeInscrito: inscricaoData.nome, 
            emailInscrito: inscricaoData.email,
            contactEmail: eventoData.contactEmail,
            contactPhone: eventoData.contactPhone,
            presencas,
            totalSessoes,
            percentual,
            certificado: (eventoData?.liberarCertificados === true) && percentual >= minPresenca && (!requerAtividadeFinal || enviouAtividadeFinal),
            dataInscricao: inscricaoData.dataInscricao?.toDate?.() || null,
            eventoDataRaw: eventoData,
          });
        }
      }

      if (eventosComInscricao.length === 0) {
        setError("Nenhuma inscrição encontrada para este CPF");
      } else {
        const primeiroNome = eventosComInscricao[0].nomeInscrito || "Participante";
        setResult({
          nome: primeiroNome,
          eventos: eventosComInscricao
        });
      }
    } catch (err) {
      console.error("Erro na consulta:", err);
      setError("Erro ao buscar inscrições. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCert = async (item: any) => {
    const rawCpf = cpf.replace(/\D/g, "");
    setDownloadingId(item.id);

    try {
      const eventoCompleto: Evento = {
        id: item.id,
        name: item.nome,
        description: item.eventoDataRaw.description || "",
        startDate: parseTimestamp(item.eventoDataRaw.startDate),
        endDate: parseTimestamp(item.eventoDataRaw.endDate),
        registrationDeadLine: parseTimestamp(item.eventoDataRaw.registrationDeadLine),
        maxParticipants: item.eventoDataRaw.maxParticipants || 0,
        registrationsCount: item.eventoDataRaw.registrationsCount || 0,
        status: item.eventoDataRaw.status || "aberto",
        minAttendancePercentForCertificate: item.eventoDataRaw.minAttendancePercentForCertificate || 80,
        cargaHoraria: item.eventoDataRaw.cargaHoraria || 0,
        certificateBgUrl: item.eventoDataRaw.certificateBgUrl || "",
        certificateText: item.eventoDataRaw.certificateText || "",
      };

      await gerarPdfCertificado(eventoCompleto, {
        nome: item.nomeInscrito,
        cpf: formatarCpfExibicao(rawCpf),
      });
    } catch (err) {
      console.error("Erro ao gerar certificado PDF:", err);
      alert("Ocorreu um erro ao gerar o certificado. Tente novamente.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container">
      <h1>Consulte suas inscrições</h1>
      
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
          <h2>Resultados para: <br />{result.nome}</h2>
          
          <div className="eventos-grid">
            {result.eventos.map((evento) => (
              <div key={evento.id} className="evento-card">
                <h3>{evento.nome}</h3>
                
                <div className="info-group">
                  <h4>Dados da Inscrição:</h4>
                  <p><strong>Nome:</strong> {evento.nomeInscrito}</p>
                  <p><strong>Email:</strong> {evento.emailInscrito}</p>
                </div>

                <div className="info-group">
                  <p>
                    <strong>Certificado: </strong>
                    <span className={evento.certificado ? "success" : "warning"}>
                      {evento.certificado ? "✅ Disponível" : "❌ Indisponível"}
                    </span>
                  </p>

                  {evento.certificado && (
                    <button
                      className="download-cert-btn"
                      onClick={() => handleDownloadCert(evento)}
                      disabled={downloadingId === evento.id}
                    >
                      {downloadingId === evento.id ? "⏳ Gerando PDF..." : "📄 Baixar Certificado (PDF)"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="contact-info">
            <h3>Encontrou erros?</h3>
            <p>
              Entre em contato com a organização do evento.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


