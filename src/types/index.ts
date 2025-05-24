import { Timestamp } from "firebase/firestore";

/**
 * Tipo para campos que vêm como objeto com timestampValue (ex: API REST)
 */
export type FirebaseTimestamp = Timestamp;

/**
 * Tipo para eventos no sistema
 */
export type Evento = {
  id: string;
  name: string;
  description: string;
  startDate: Date | FirebaseTimestamp | null;
  endDate: Date | FirebaseTimestamp | null;
  registrationDeadLine: Date | FirebaseTimestamp | null;
  maxParticipants: number;
  registrationsCount: number;
  status: "aberto" | "encerrado" | "em breve" | "em andamento";
  minAttendancePercentForCertificate: number;
};

/**
 * Tipo para participantes inscritos
 */
export type Participante = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  institution: string;
  // eventoId?: string;
  dataInscricao: Date | FirebaseTimestamp | null;
};

export interface ParticipanteData {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  institution: string;
  dataInscricao: string;
}

/**
 * Tipo para compatibilidade com API REST
 */
export type TimestampValue = {
  timestampValue?: string;
} | FirebaseTimestamp;

