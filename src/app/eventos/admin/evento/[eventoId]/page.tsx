/**
 * Página principal de administração do evento
 * Rota: /eventos/admin/evento/[eventoId]/page.tsx
 */
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Inscricao } from "@/types"

export default function EventoAdminPage() {
  const params = useParams();
  const eventoId = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;

  return (
    <div className="p-4">
      <Link 
        href={`/eventos/admin/evento/${eventoId}/presenca`}
        className="p-4 border rounded-lg hover:bg-gray-50"
      >
        <h2 className="font-semibold">Controle de Presença</h2>
      </Link>

      <Link 
        href={`/eventos/admin/evento/${eventoId}/folha-assinaturas`}
        className="p-4 border rounded-lg hover:bg-gray-50"
      >
        <h2 className="font-semibold">Imprimir Folha de Assinaturas</h2>
      </Link>
    </div>
  );
}