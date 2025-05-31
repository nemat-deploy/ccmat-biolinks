'use client';

import { useState } from 'react';
import { marcarPresenca } from '@/lib/firebase/eventos';

interface PresencaButtonProps {
  eventoId: string;
  inscritoId: string;
  onPresencaMarcada?: () => void;
}

export default function PresencaButton({ eventoId, inscritoId, onPresencaMarcada }: PresencaButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePresenca = async () => {
    try {
      setLoading(true);
      await marcarPresenca(eventoId, inscritoId);
      if (onPresencaMarcada) {
        onPresencaMarcada();
      }
    } catch (error: any) {
      console.error("Erro ao marcar presença:", error);
      alert(`Erro ao marcar presença: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePresenca}
      disabled={loading}
      className="presenca-button"
    >
      {loading ? 'Processando...' : 'Registrar Presença'}
    </button>
  );
}