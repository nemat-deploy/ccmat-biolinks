/* function for adjust the dates when save in firebase firestore */

/**
 * Converte uma string de data/hora brasileira (dd/MM/yyyy HH:mm) para um objeto Date.
 */
export function parseBrazilianDateTimeToLocalDate(value: string): Date | null {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;

  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy HH:mm).
 * Aceita tanto `Date` quanto `string` (ISO ou dd/MM/yyyy HH:mm).
 */
export function formatDateToBrazilianDateTime(date: Date | string): string {
  let parsedDate: Date;

  if (typeof date === "string") {
    // Tenta interpretar como data ISO ou formato brasileiro
    parsedDate = new Date(date);

    // Se não funcionou, tenta converter manualmente de 'dd/MM/yyyy HH:mm'
    if (isNaN(parsedDate.getTime())) {
      const [datePart, timePart] = date.split(" ");
      if (!datePart || !timePart) return "";

      const [day, month, year] = datePart.split("/");
      const [hour, minute] = timePart.split(":");

      parsedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );
    }
  } else {
    parsedDate = date;
  }

  if (isNaN(parsedDate.getTime())) return "";

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();

  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Converte uma string de data/hora brasileira (dd/MM/yyyy HH:mm) para uma string ISO UTC.
 */
export function parseBrazilianDateTimeToUTCISOString(value: string): string | null {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;

  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");

  if ([day, month, year, hour, minute].some((part) => isNaN(Number(part)))) {
    return null;
  }

  const utcDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    )
  );

  return isNaN(utcDate.getTime()) ? null : utcDate.toISOString();
}