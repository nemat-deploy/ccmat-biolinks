'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * Busca participantes do evento no Firestore
 */
export async function getParticipants(eventoId: string) {
  const snapshot = await getDoc(doc(db, 'eventos', eventoId, 'inscricoes', 'dados'));
  return snapshot.exists() ? snapshot.data().participants : [];
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