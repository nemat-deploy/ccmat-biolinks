import { Timestamp } from "firebase/firestore";

export type TimestampValue = {
  timestampValue?: string;
};

/**
 * Converte vários formatos de data em Date ou null
 * @param value - Pode ser:
 *   - Date
 *   - Firebase Timestamp
 *   - Objeto com campo timestampValue (ex: API REST)
 *   - String ISO ("2025-01-01T00:00:00Z")
 * @returns Date | null
 */
export function parseTimestamp(
  value: Date | Timestamp | string | TimestampValue | null | undefined
): Date | null {
  if (!value) return null;

  // Se for Date
  if (value instanceof Date) {
    return value;
  }

  // Se for Firebase Timestamp
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }

  // Se for objeto com timestampValue
  if (typeof value === "object" && "timestampValue" in value && typeof value.timestampValue === "string") {
    const date = new Date(value.timestampValue);
    return isNaN(date.getTime()) ? null : date;
  }

  // Se for string ISO
  if (typeof value === "string") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatarData(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}