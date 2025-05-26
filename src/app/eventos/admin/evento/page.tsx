import { getEventos } from '@/lib/firebase/eventos';
import Link from 'next/link';

export default async function AdminEventosPage() {
  try {
    const eventos = await getEventos();

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Eventos Disponíveis</h1>
        
        {eventos.length === 0 ? (
          <p>Nenhum evento encontrado</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {eventos.map((evento) => (
              <Link
                key={evento.id}
                href={`/eventos/admin/evento/${evento.id}`}
                className="border p-4 rounded-lg hover:shadow-md transition-shadow"
              >
                <h2 className="font-semibold">{evento.name}</h2>
                <p className="text-sm text-gray-600 mt-2">
                  {evento.registrationsCount} inscritos • Status: {evento.status}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar lista de eventos
      </div>
    );
  }
}