'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInscritos, marcarPresenca } from '@/lib/firebase/eventos';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './page.css';

export default function PresencePage() {
  const params = useParams();
  const router = useRouter();
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/eventos/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      setAuthChecked(true);
      loadInscritos();
    });

    return () => unsubscribe();
  }, [router]);

const loadInscritos = async () => {
  try {
    const eventoIdRaw = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;
    if (!eventoIdRaw) throw new Error("EventoId não definido.");
    
    const lista = await getInscritos(eventoIdRaw);
    setInscritos(lista);
  } catch (error) {
    console.error("Erro ao carregar inscritos:", error);
  } finally {
    setLoading(false);
  }
};

const handlePresenca = async (inscritoId: string) => {
  try {
    setLoading(true);
    
    const eventoIdRaw = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;
    if (!eventoIdRaw) throw new Error("EventoId não definido.");
    
    await marcarPresenca(eventoIdRaw, inscritoId);
    
    setInscritos(prev => prev.map(inscrito => 
      inscrito.id === inscritoId 
        ? { 
            ...inscrito, 
            attendances: [...(inscrito.attendances || []), { 
              timestamp: new Date() 
            }] 
          } 
        : inscrito
    ));
  } catch (error: any) {
    console.error("Erro completo:", error);
    alert(`Erro ao marcar presença: ${error.message}\nVerifique o console para detalhes.`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="presenca-container">
      <h1>Controle de Presença</h1>
      
      <table className="presenca-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Presenças</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {inscritos.map((inscrito) => (
            <tr key={inscrito.id}>
              <td>{inscrito.nome}</td>
              <td>{inscrito.attendances?.length || 0}</td>
              <td>
                <button 
                  onClick={() => handlePresenca(inscrito.id)}
                  disabled={loading}
                  className="presenca-button"
                >
                  {loading ? 'Processando...' : 'Registrar Presença'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
