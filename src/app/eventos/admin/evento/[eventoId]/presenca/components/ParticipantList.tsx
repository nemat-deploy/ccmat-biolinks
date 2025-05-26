'use client';

import { registerPresence } from '../actions';

type Participant = {
  id: string;
  name: string;
  attendances: Array<{ session: string; timestamp: string }>;
};

/**
 * Componente que exibe a lista de participantes com ações de presença
 */
export function ParticipantList({
  eventoId,
  participants,
}: {
  eventoId: string;
  participants: Participant[];
}) {
  const handlePresence = async (participantId: string, session: 'manha' | 'tarde') => {
    const result = await registerPresence(eventoId, participantId, session);
    if (result.error) alert(result.error);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nome</th>
            <th className="py-2 px-4 border-b">Presenças</th>
            <th className="py-2 px-4 border-b">Ações</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant) => (
            <tr key={participant.id}>
              <td className="py-2 px-4 border-b">{participant.name}</td>
              <td className="py-2 px-4 border-b">
                {participant.attendances.length}
              </td>
              <td className="py-2 px-4 border-b space-x-2">
                <button
                  onClick={() => handlePresence(participant.id, 'manha')}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  Manhã
                </button>
                <button
                  onClick={() => handlePresence(participant.id, 'tarde')}
                  className="bg-green-500 text-white px-3 py-1 rounded"
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