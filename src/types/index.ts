// src/types/index.ts

import { Timestamp } from "firebase/firestore";

export const STATUS = ["aberto", "encerrado"] as const;
export type StatusEvento = typeof STATUS[number];
export type EventoSemId = Omit<Evento, "id">;

export type FirebaseTimestamp = Timestamp;

export type TimestampValue = {
  timestampValue?: string;
} | FirebaseTimestamp;

export type Evento = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
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
  admins?: string[];
};

export interface Sessao {
  id: string;
  titulo: string;
  data: string;
  horario: string;
}

export type RegistroPresenca = {
  timestamp: Date | FirebaseTimestamp;
  session: 'manha' | 'tarde' | 'noite';
  eventId?: string;
};

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
  isMonitor?: boolean;
};

export interface ParticipanteData {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  institution: string;
  dataInscricao: Date | null;
  isMonitor?: boolean;
}

export type PresencaResponse = {
  success: boolean;
  error?: string;
  lastAttendance?: RegistroPresenca;
};

export type FirestoreParticipante = Omit<Participante, 'id' | 'dataInscricao'> & {
  dataInscricao: FirebaseTimestamp | null;
  attendances?: Array<{
    timestamp: FirebaseTimestamp;
    session: 'manha' | 'tarde' | 'noite';
  }>;
  enviou_atividade_final?: boolean;
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
