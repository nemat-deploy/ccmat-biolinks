// src/app/eventos/admin/evento/[eventoId]/presenca/actions.ts
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Busca participantes do evento no Firestore
 */
// export async function getParticipants(eventoId: string) {
//   const snapshot = await getDoc(doc(db, 'eventos', eventoId, 'inscricoes', 'dados'));
//   return snapshot.exists() ? snapshot.data().participants : [];
// }
export async function getParticipants(eventoId: string) {
  const snapshot = await getDoc(doc(db, 'eventos', eventoId, 'inscricoes', 'dados'));
  if (!snapshot.exists()) return [];

  const data = snapshot.data();
  return data.participants.map((p: any) => ({
    ...p,
    enviou_atividade_final: Boolean(p.enviou_atividade_final) // garantir valor booleano
  }));
}

/**
 * Registra presença de um participante
 */
export async function registerPresence(
  eventoId: string,
  participantId: string,
  session: 'manha' | 'tarde'
) {
  try {
    const participantRef = doc(db, 'eventos', eventoId, 'inscricoes', participantId);
    
    await updateDoc(participantRef, {
      attendances: arrayUnion({
        session,
        timestamp: new Date().toISOString()
      })
    });
    
    return { success: true };
  } catch (error) {
    return { error: 'Falha ao registrar presença' };
  }
}