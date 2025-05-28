import { getEventos } from '@/lib/firebase/eventos';
import Link from 'next/link';
import './page.css'

export default async function AdminEventosPage() {
  try {
    const eventos = await getEventos();

    return (
      <div className="p-4">
        <h1 style={{ fontSize: '20px', textAlign: 'center', marginTop: '30px' }}>Eventos Disponíveis</h1>
        
        {eventos.length === 0 ? (
          <p>Nenhum evento encontrado</p>
        ) : (
          <div>
            {eventos.map((evento) => (
              <Link
                key={evento.id}
                href={`/eventos/admin/evento/${evento.id}`}
                className="linkEventoPresenca"
              >
              <div className="cardEventoPresenca">
                <h2 className="font-semibold">{evento.name}</h2>
                <p>
                  {evento.registrationsCount} inscritos | Status: {evento.status}
                </p>
              </div>
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