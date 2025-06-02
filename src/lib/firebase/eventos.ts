// src/lib/firebase/eventos.ts
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { getDoc } from 'firebase/firestore';
import type { Evento } from "@/types";
import { EventoSemId } from "@/types";

export interface Inscrito {
  id: string;
  nome: string;
  email: string;
  attendances: Array<{
    timestamp: Date;
    registradoPor?: string;
    registradoEm?: Timestamp;
  }>;
}

export async function getInscritos(eventoId: string): Promise<Inscrito[]> {
  try {
    const inscritosCol = collection(db, 'eventos', eventoId, 'inscricoes');
    const snapshot = await getDocs(inscritosCol);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const attendancesRaw = data.attendances || [];

      return {
        id: doc.id,
        nome: data.nome || 'Nome não informado',
        email: data.email || 'Email não informado',
        attendances: attendancesRaw.map((a: any) => ({
          timestamp: a.timestamp?.toDate?.() || new Date(a.timestamp),
          registradoPor: a.registradoPor,
          registradoEm: a.registradoEm
        }))
      };
    });
  } catch (error) {
    console.error("Erro ao buscar inscritos:", error);
    throw error;
  }
}

export async function marcarPresenca(
  eventoId: string, 
  inscritoId: string
): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const inscritoRef = doc(db, 'eventos', eventoId, 'inscricoes', inscritoId);
  const snap = await getDoc(inscritoRef);

  if (!snap.exists()) {
    throw new Error("Inscrito não encontrado");
  }

  const data = snap.data();
  const attendances: any[] = data.attendances || [];

  if (attendances.length > 0) {
    const ultima = attendances[attendances.length - 1];
    const ultimaHora = ultima.timestamp?.toDate?.() || new Date(ultima.timestamp);
    const agora = new Date();
    // const diferencaHoras = (agora.getTime() - ultimaHora.getTime()) / (1000 * 60 * 60);

    // if (diferencaHoras < 4) {
    //   throw new Error("Presenças válidas com intervalo mínimo de 4 horas.");
    // }
  }

  await updateDoc(inscritoRef, {
    attendances: arrayUnion({
      registradoPor: user.email,
      timestamp: Timestamp.now(),
      registradoEm: Timestamp.now()
    })
  });
}

export async function getEventos(): Promise<Evento[]> {
  const eventosCol = collection(db, 'eventos');
  const snapshot = await getDocs(eventosCol);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description || '',
      registrationsCount: data.registrationsCount || 0,
      status: data.status || 'aberto'
    };
  });
}

export async function getEvento(id: string): Promise<Evento | null> {
  const docRef = doc(db, 'eventos', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    id: snap.id,
    name: data.name || '',
    description: data.description || '',
    registrationsCount: data.registrationsCount || 0,
    status: data.status || 'aberto',
    startDate: data.startDate?.toDate?.() ?? new Date(data.startDate ?? Date.now()),
    endDate: data.endDate?.toDate?.() ?? new Date(data.endDate ?? Date.now()),
    registrationDeadLine: data.registrationDeadLine?.toDate?.() ?? new Date(data.registrationDeadLine ?? Date.now()),
    maxParticipants: data.maxParticipants || 0,
    totalSessoes: data.totalSessoes || 0,
    minAttendancePercentForCertificate: data.minAttendancePercentForCertificate || 0,
  };
}

export function buildEventoSemId(params: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  registrationDeadLine?: string;
  maxParticipants?: number;
  totalSessoes?: number;
  minAttendancePercentForCertificate?: number;
  status: "aberto" | "encerrado";
  registrationsCount?: number;
  sessions?: EventoSemId["sessions"];
}): EventoSemId {
  return {
    name: params.name,
    description: params.description,
    startDate: params.startDate ? new Date(params.startDate) : null,
    endDate: params.endDate ? new Date(params.endDate) : null,
    registrationDeadLine: params.registrationDeadLine ? new Date(params.registrationDeadLine) : null,
    maxParticipants: params.maxParticipants,
    totalSessoes: params.totalSessoes,
    minAttendancePercentForCertificate: params.minAttendancePercentForCertificate,
    status: params.status,
    registrationsCount: params.registrationsCount ?? 0,
    sessions: params.sessions ?? [],
  };
}
