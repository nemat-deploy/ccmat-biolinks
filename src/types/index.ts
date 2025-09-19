// src/types/index.ts

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
  requer_atividade_final?: boolean;
  createdBy?: string;
  admins?: string[]; // Array de UIDs dos administradores
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
  attendances?: RegistroPresenca[]; 
  certificateIssued?: boolean;
  enviou_atividade_final?: boolean;
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

// tipo compatível com dados do Firestore
export type FirestoreParticipante = Omit<Participante, 'id' | 'dataInscricao'> & {
  dataInscricao: FirebaseTimestamp | null;
  attendances?: Array<{
    timestamp: FirebaseTimestamp;
    session: 'manha' | 'tarde' | 'noite';
  }>;
  enviou_atividade_final?: boolean; // adiciona compatibilidade
};

export interface Inscricao {
  id: string;
  nome: string;
  email: string;
  attendances: Array<{
    timestamp: Date;
    registradoPor?: string;
    registradoEm?: Timestamp;
  }>;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'user';
}

// this is only use into 'elegiveis-certificado' page
export interface ParticipanteDataWithDate extends Omit<ParticipanteData, 'dataInscricao'> {
  dataInscricao: Date | null;
}

export interface Attendance {
  registradoPor: string;
  registradoEm: Date;
  timestamp: Date;
}

export interface ParticipanteComCertificado extends ParticipanteDataWithDate {
  presencaPercentual: number;
  attendances: Attendance[];
  certificateIssued: boolean;
}

// tipos para FontAwesome no fontawesome.d.ts