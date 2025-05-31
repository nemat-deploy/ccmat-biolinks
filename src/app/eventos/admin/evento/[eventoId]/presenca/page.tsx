'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInscritos, marcarPresenca } from '@/lib/firebase/eventos';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './page.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

export default function PresencePage() {
  const params = useParams();
  const router = useRouter();
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [nomeEvento, setNomeEvento] = useState<string | null>(null);

  // ✅ EXTRAÍMOS O eventoId AQUI, NO ESCOPO DO COMPONENTE
  const eventoId = Array.isArray(params.eventoId) ? params.eventoId[0] : params.eventoId;

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
      if (!eventoId) throw new Error("EventoId não definido.");

      // carregar dados do evento
      const eventoRef = doc(db, 'eventos', eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (eventoSnap.exists()) {
        setNomeEvento(eventoSnap.data().name);
      } else {
        setNomeEvento(null);
      }
      
      const lista = await getInscritos(eventoId);
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
      
      if (!eventoId) throw new Error("EventoId não definido.");
      
      await marcarPresenca(eventoId, inscritoId);
      
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
      alert(`Erro ao marcar presença:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="presenca-container">
      <p className="presencaTitle">Controle de Presença - <span className="eventoTitle">{nomeEvento || eventoId}</span></p>
      
      <table className="presenca-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th style={{ textAlign: "center" }}>Presenças</th>
            <th style={{ textAlign: "center" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {inscritos.map((inscrito) => (
            <tr key={inscrito.id}>
              <td>{inscrito.nome}</td>
              <td style={{ textAlign: "center" }}>{inscrito.attendances?.length || 0}</td>
              <td style={{ textAlign: "center" }}>
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