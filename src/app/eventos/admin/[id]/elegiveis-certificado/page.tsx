"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { Evento, ParticipanteData } from "@/types";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import "./page.css";
import { parseTimestamp } from "@/lib/utils";
import Image from "next/image";
import type { ParticipanteComCertificado } from '@/types'; // tipo usado somente nessa página
import LoadingMessage from "@/app/components/LoadingMessage"; // o spinner

export default function CertificadosPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  // const [participantes, setParticipantes] = useState<ParticipanteData[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteComCertificado[]>([]); // substitui a linha acima, e usando o tipo ParticipanteComCertificado que foi importado
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // normalizar texto removendo acentos
  const normalizeText = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // filtrar participantes com base no termo de busca
  const filteredParticipantes = participantes.filter((p) => {
    if (!searchTerm) return true;
    const normalizedSearch = normalizeText(searchTerm);
    const normalizedNome = normalizeText(p.nome);
    return normalizedNome.includes(normalizedSearch);
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
        await loadParticipantesComCertificado(id);
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
      minAttendancePercentForCertificate: data.minAttendancePercentForCertificate ?? 80,
      totalSessoes: data.totalSessoes ?? 0,
    });
  }

async function loadParticipantesComCertificado(eventoId: string) {
  const ref = collection(db, `eventos/${eventoId}/inscricoes`);
  const snap = await getDocs(ref);
  const eventoDoc = await getDoc(doc(db, "eventos", eventoId));
  const eventoData = eventoDoc.data();

  const totalSessoes = eventoData?.totalSessoes || 0;
  const minPercentual = eventoData?.minAttendancePercentForCertificate || 80;

  const list: ParticipanteComCertificado[] = [];
    
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const attendances = d.attendances || [];

    // calcula percentual de presença
    const presencaPercentual = totalSessoes > 0 
      ? Math.round((attendances.length / totalSessoes) * 100) 
      : 0;

    // verifica se atingiu a frequência mínima
    const atingiuFrequenciaMinima = presencaPercentual >= minPercentual;

    // verifica se o evento requer atividade final
    const requerAtividadeFinal = eventoData?.requer_atividade_final === true;

    // verifica se enviou a atividade final (se for requerido)
    const enviouAtividadeFinal = Boolean(d.enviou_atividade_final);

    // adicionar à lista somente se:
    // - Frequência mínima foi atingida
    // - Se o evento requer atividade final, então ela precisa ter sido enviada
    if (atingiuFrequenciaMinima && (!requerAtividadeFinal || enviouAtividadeFinal)) {
      list.push({
        id: docSnap.id,
        cpf: docSnap.id,
        nome: d.nome || "",
        email: d.email || "",
        telefone: d.telefone || "",
        institution: d.institution || "",
        dataInscricao: d.dataInscricao?.toDate?.() ?? null,
        presencaPercentual,
        attendances: attendances,
        certificateIssued: d.certificateIssued || false,
      });
    }
  });

    setParticipantes(list);
  }

function exportToCSV() {
  if (participantes.length === 0) return;

  // function format cpf
  const formatCPF = (cpf: string) => {
    cpf = cpf.padStart(11, '0'); // Garante 11 dígitos
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const headers = ["Nome", "CPF", "Email", "Instituição", "Presença (%)"];
  
  const csvContent = [
    headers.join(","),
    ...participantes.map(p => [
      `"${p.nome.replace(/"/g, '""')}"`, // scape aspas in name
      `"${formatCPF(p.cpf)}"`,           // CPF formatted with text
      `"${p.email}"`,
      `"${p.institution || ''}"`,
      p.presencaPercentual
    ].join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `certificados-${evento?.name || id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  if (loading) {
    return <LoadingMessage fullHeight delay={0} />;
  }
  if (erro) return <p>{erro}</p>;

  function formatCPF(cpf: string) {
    // remove any non-digit characters first (in case it comes formatted)
    const cleaned = cpf.replace(/\D/g, '');

    // apply the CPF mask: 123.456.789-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "auto" }}>
      <div className="titleFolhaAssinaturas">
        <div className="titleFolhaAssinaturasItem">
          {/* Regular img tag for printing */}
          <img
            src="/images/logo-ufdpar-100px.png"
            alt="Logo UFDPar"
            className="print-image"
            style={{ display: 'none' }}
          />
          {/* Next.js Image for screen */}
          <Image
            src="/images/logo-ufdpar-100px.png"
            alt="Logo UFDPar"
            width={100}
            height={100}
            className="screen-image"
          />
        </div>

        <div className="titleFolhaAssinaturasItem headerText">
          Universidade Federal do Delta do Parnaíba <br />
          Coordenação do Curso de Matemática <br />
          Núcleo de Estudos em Matemática
        </div>

        <div className="titleFolhaAssinaturasItem">
          {/* Regular img tag for printing */}
          <img
            src="/images/logo-nemat-100px.png"
            alt="Logo NEMAT"
            className="print-image"
            style={{ display: 'none' }}
          />
          {/* Next.js Image for screen */}
          <Image
            src="/images/logo-nemat-100px.png"
            alt="Logo NEMAT"
            width={114}
            height={80}
            className="screen-image"
          />
        </div>
      </div>

      <div className="topContent">
        <h1 className="titleCourse">{evento?.name || id} - Elegíveis para Certificado</h1>
        
        <div className="infoBox">
          <p>
            <strong>Frequência mínima requerida:</strong> {evento?.minAttendancePercentForCertificate}%<br />
            <strong>Total de sessões do evento:</strong> {evento?.totalSessoes}<br />
            <strong>Participantes elegíveis:</strong> {participantes.length}
          </p>
        </div>
      </div>

      <div className="search-container" style={{ 
        display: "flex", 
        width: "1200px", 
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0" 
      }}>
        <div style={{ 
          position: "relative", 
          width: "400px", 
          border: "1px solid #ddd", 
          borderRadius: "4px" 
        }}>
          <FontAwesomeIcon 
            icon={faSearch} 
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#666",
              zIndex: 1
            }} 
          />
          <input
            type="text"
            placeholder="buscar por nome (tecle ESC para limpar)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setSearchTerm('')}
            style={{
              width: "100%",
              padding: "10px 10px 10px 40px", 
              borderRadius: "4px",
              border: "1px solid gray",
              fontSize: "16px",
              outline: "none", 
              boxSizing: "border-box" 
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
                padding: "0 8px" 
              }}
              title="Limpar busca"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button onClick={exportToCSV} className="btnExportar">
            Exportar para CSV
          </button>
          
          <button onClick={() => window.print()} className="btnImprimir">
            Imprimir Lista
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Email</th>
            <th>Instituição</th>
            <th>Presença</th>
          </tr>
        </thead>
        <tbody>
          {filteredParticipantes.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center" }}>
                {searchTerm 
                  ? "Nenhum participante encontrado" 
                  : "Nenhum participante atingiu a frequência mínima para certificado"}
              </td>
            </tr>
          ) : (
            filteredParticipantes
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((p) => (
                <tr key={p.cpf}>
                  <td>{p.nome}</td>
                  <td>{p.cpf}</td>
                  <td>{p.email}</td>
                  <td>{p.institution || '-'}</td>
                  <td>
                    {p.presencaPercentual}% ({p.attendances?.length || 0}/{evento?.totalSessoes || 0} sessões)
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  );
}