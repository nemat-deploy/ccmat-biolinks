// src/utils/date.ts

import { Timestamp } from "firebase/firestore";

/**
 * Converte um valor Date ou Timestamp em um objeto Date.
 * Retorna null se o valor for nulo ou indefinido.
 * 
 * Útil para ler datas vindas do Firestore.
 */
export function toDateSafe(value: Date | Timestamp | null | undefined): Date | null {
  if (value == null) return null;

  // Evita problemas caso Timestamp venha de instâncias diferentes (SSR/CSR)
  if (typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate();
  }

  return value as Date;
}

/**
 * Converte um objeto Date em um Timestamp do Firestore.
 * Retorna null se o valor for nulo ou indefinido.
 * 
 * Útil para salvar datas no Firestore.
 */
export function toTimestamp(value: Date | null | undefined): Timestamp | null {
  if (value == null) return null;
  return Timestamp.fromDate(value);
}

/**
 * Formata uma data (Date ou Timestamp) para o formato aceito por inputs `datetime-local`.
 * Exemplo: "2025-06-01T10:30"
 * 
 * Retorna string vazia se o valor for nulo, indefinido ou inválido.
 */
export function formatDateInput(value: Date | Timestamp | null | undefined): string {
  const date = toDateSafe(value);
  if (!date || isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

/**
 * Converte uma string vinda de um input `datetime-local` em um objeto Date.
 * Retorna null se a string for vazia ou inválida.
 */
export function parseDateInput(input: string): Date | null {
  if (!input?.trim()) return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date;
}
