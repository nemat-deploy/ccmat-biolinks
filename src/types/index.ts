// types/index.ts

import { Timestamp } from "firebase/firestore";

export const STATUS = ["aberto", "encerrado"] as const;
export type StatusEvento = typeof STATUS[number];
export type EventoSemId = Omit<Evento, "id">;

/**
 * Tipo para campos que vêm como objeto com timestampValue (ex: API REST)
 */
export type FirebaseTimestamp = Timestamp;

/**
 * Tipo para compatibilidade com API REST
 */
export type TimestampValue = {
  timestampValue?: string;
} | FirebaseTimestamp;

export type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationDeadLine: Date | null;
  maxParticipants: number;
  registrationsCount: number;
  status: "aberto" | "encerrado";
  minAttendancePercentForCertificate: number;
  totalSessoes?: number;
  sessions?: Sessao[];
};

export interface Sessao {
  id: string;
  titulo: string;
  data: string;
  horario: string;
}


/**
 * tipo para registro de presença
 */
export type RegistroPresenca = {
  timestamp: Date | FirebaseTimestamp;
  session: 'manha' | 'tarde' | 'noite';
  eventId?: string; // Opcional para registrar em qual evento/sessão
};

/**
 * tipo base para participantes inscritos
 */
export type Participante = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  institution: string;
  dataInscricao: Date | FirebaseTimestamp | null;
  attendances?: RegistroPresenca[]; // Novo campo para presenças
  certificateIssued?: boolean; // Novo campo para status do certificado
};

/**
 * tipo para formulários/API (sem campos opcionais)
 */
export interface ParticipanteData {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  institution: string;
  dataInscricao: string | null;
}

/**
 * Tipo para resposta de operações com presença
 */
export type PresencaResponse = {
  success: boolean;
  error?: string;
  lastAttendance?: RegistroPresenca;
};

// utilitário para converter tipos do Firestore
export type FirestoreParticipante = Omit<Participante, 'id'> & {
  attendances?: Array<{
    timestamp: FirebaseTimestamp;
    session: 'manha' | 'tarde' | 'noite';
  }>;
};

// src/types/inscricao.ts
export type Inscricao = {
  nome: string
  email: string
  telefone: string
  institution: string
  dataInscricao: Date
  attendances: string[] // ou outro tipo se não for apenas string
  certificateIssued: boolean
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  isAdmin: boolean;
}