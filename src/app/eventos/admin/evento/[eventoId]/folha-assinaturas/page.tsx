'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getInscritos, getEvento } from '@/lib/firebase/eventos';
import Image from 'next/image';
import LoadingMessage from '@/app/components/LoadingMessage'; 
import './page.css';

export default function FolhaAssinaturasPage() {
  const params = useParams();
  const eventoId = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;

  const [inscritos, setInscritos] = useState<any[]>([]);
  const [nomeEvento, setNomeEvento] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      if (!eventoId) return;

      try {
        const [eventoData, inscritosData] = await Promise.all([
          getEvento(eventoId),
          getInscritos(eventoId),
        ]);

        setNomeEvento(eventoData?.name || 'Evento sem nome');
        const ordenados = [...inscritosData].sort((a, b) => a.nome.localeCompare(b.nome));
        setInscritos(ordenados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [eventoId]);

  if (loading) {
    return <LoadingMessage text="Carregando nomes..." fullHeight delay={0} />;
  }

  return (
    <div className="p-6">
      <div className="titleFolhaAssinaturas">
        <div className="titleFolhaAssinaturasItem">
          <Image src="/images/logo-ufdpar-100px.png" alt="Logo UFDPar" width={100} height={100} />
        </div>

        <div className="titleFolhaAssinaturasItem headerText">
          Universidade Federal do Delta do Parnaíba <br />
          Coordenação do Curso de Matemática <br />
          Núcleo de Estudos em Matemática
        </div>

        <div className="titleFolhaAssinaturasItem">
          <Image src="/images/logo-nemat-100px.png" alt="Logo NEMAT" width={114} height={80} />
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th colSpan={2}>Frequência - {nomeEvento}</th>
          </tr>
        </thead>
        <tbody>
          {inscritos.map((inscrito) => (
            <tr key={inscrito.id}>
              <td className="names">{inscrito.nome}</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
