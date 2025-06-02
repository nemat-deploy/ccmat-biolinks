'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getInscritos } from '@/lib/firebase/eventos';
import { Inscricao } from '@/types/inscricao';
import './page.css'

export default function FolhaAssinaturasPage() {
  const params = useParams();
  const eventoId = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;

  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarInscritos() {
      if (!eventoId) return;
      
      try {
        const lista = await getInscritos(eventoId);
        // Ordenar por nome
        const ordenados = [...lista].sort((a, b) => a.nome.localeCompare(b.nome));
        setInscritos(ordenados);
      } catch (error) {
        console.error('Erro ao carregar inscritos:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarInscritos();
  }, [eventoId]);

  return (
    <div className="p-6">
      <h1 className="titleFolhaAssinaturas">Folha de Assinaturas</h1>
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="min-w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-4 py-2">Nome do Participante</th>
              <th className="border px-4 py-2">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {inscritos.map((inscrito) => (
              <tr key={inscrito.id}>
                <td className="names">{inscrito.nome}</td>
                <td className="border px-4 py-2 h-16"></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}