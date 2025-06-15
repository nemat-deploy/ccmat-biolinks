// src/app/eventos/admin/evento/[eventoId]/presenca/components/ParticipantList.tsx
'use client';

import { registerPresence } from '../actions';
import { useState, useEffect } from 'react';

type Participant = {
  id: string;
  name: string;
  attendances: Array<{ session: string; timestamp: string }>;
  enviou_atividade_final?: boolean;
};

// useEffect(() => {
//   console.log("Dados recebidos:", participants);
// }, [participants]);

/**
 * Componente que exibe a lista de participantes com ações de presença e atividade final
 */
export function ParticipantList({
  eventoId,
  participants: initialParticipants,
}: {
  eventoId: string;
  participants: Participant[];
}) {
  const [participants, setParticipants] = useState(initialParticipants);

  const handlePresence = async (participantId: string, session: 'manha' | 'tarde') => {
    const result = await registerPresence(eventoId, participantId, session);
    if (result.error) alert(result.error);
  };

  const toggleAtividadeFinal = async (participantId: string) => {
    try {
      const response = await fetch(`/api/atualizar-atividade-final`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ eventoId, participantId })
      });

      const result = await response.json();

      if (result.success) {
        setParticipants(prev =>
          prev.map(p =>
            p.id === participantId
              ? { ...p, enviou_atividade_final: !p.enviou_atividade_final }
              : p
          )
        );
      } else {
        alert("Erro ao atualizar atividade final.");
      }
    } catch (error) {
      console.error("Falha ao atualizar atividade final:", error);
      alert("Não foi possível atualizar o status da atividade final.");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nome</th>
            <th className="py-2 px-4 border-b">Presenças</th>
            <th className="py-2 px-4 border-b text-center">Enviou Atividade Final?</th>
            <th className="py-2 px-4 border-b">Ações</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.id}>
              <td className="py-2 px-4 border-b">{participant.name}</td>
              <td className="py-2 px-4 border-b text-center">
                {participant.attendances.length}
              </td>
              <td className="py-2 px-4 border-b text-center">
                <input
                  type="checkbox"
                  checked={Boolean(participant.enviou_atividade_final)}
                  onChange={() => toggleAtividadeFinal(participant.id)}
                  className="cursor-pointer"
                />
              </td>
              <td className="py-2 px-4 border-b space-x-2">
                <button
                  onClick={() => handlePresence(participant.id, 'manha')}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Manhã
                </button>
                <button
                  onClick={() => handlePresence(participant.id, 'tarde')}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                >
                  Tarde
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}