// src/app/eventos/admin/[id]/monitores/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Evento, ParticipanteData } from '@/types';
import LoadingMessage from '@/app/components/LoadingMessage';
import './page.css';

export default function MonitoresPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [evento, setEvento] = useState<Evento | null>(null);
  const [monitores, setMonitores] = useState<ParticipanteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchDados = async () => {
      try {
        // Busca dados do evento
        const eventoRef = doc(db, "eventos", id);
        const eventoSnap = await getDoc(eventoRef);
        if (eventoSnap.exists()) {
          setEvento({ id: eventoSnap.id, ...eventoSnap.data() } as Evento);
        } else {
          throw new Error("Evento não encontrado");
        }

        // Busca monitores
        const inscricoesRef = collection(db, `eventos/${id}/inscricoes`);
        const q = query(inscricoesRef, where("isMonitor", "==", true));
        const querySnapshot = await getDocs(q);
        
        const listaMonitores = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          cpf: docSnap.id,
          nome: docSnap.data().nome || 'N/A',
          email: docSnap.data().email || 'N/A',
          telefone: docSnap.data().telefone || 'N/A',
          institution: docSnap.data().institution || 'N/A',
          dataInscricao: docSnap.data().dataInscricao?.toDate?.() ?? null,
          isMonitor: true,
        }));
        
        // Ordena por nome
        listaMonitores.sort((a, b) => a.nome.localeCompare(b.nome));
        
        setMonitores(listaMonitores);
      } catch (error) {
        console.error("Erro ao buscar monitores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [id]);

  if (loading) {
    return <LoadingMessage text="Carregando lista de monitores..." fullHeight />;
  }

  return (
    <div className="monitores-container">
      <div className="header-print">
        <h1>{evento?.name || 'Evento'}</h1>
        <h2>Monitores e Organizadores</h2>
        <button onClick={() => window.print()} className="print-button">
          Imprimir Lista
        </button>
      </div>
      
      {monitores.length === 0 ? (
        <p className="emptyMessage"><em>Nenhum monitor/organizador encontrado para este evento.</em></p>
      ) : (
        <table className="monitores-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>CPF</th>
            </tr>
          </thead>
          <tbody>
            {monitores.map(monitor => (
              <tr key={monitor.id}>
                <td>{monitor.nome}</td>
                <td>{monitor.email}</td>
                <td>{monitor.cpf}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

