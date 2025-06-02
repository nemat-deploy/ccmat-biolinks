"use client";

import { useEffect, useState, FormEvent } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Evento, EventoSemId, StatusEvento } from "@/types";
import slugify from "slugify";
import "./EventoForm.css";
import { format, parseISO } from 'date-fns';
import { formatDateInput, parseDateInput } from "@/utils/date";
import { IMaskInput } from 'react-imask'
import {
  parseBrazilianDateTimeToLocalDate,
  formatDateToBrazilianDateTime,
} from '@/utils/dateUtils'
import { parseBrazilianDateTimeToUTCISOString } from '@/utils/dateUtils'

// setting dates
const formatToFirestoreString = (date: Date | null) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const parseDateString = (value: string): Date | null => {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;

  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");

  const localDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute)
  );

  return isNaN(localDate.getTime()) ? null : localDate;
};
// end setting date

interface EventoFormProps {
  isEditing: boolean;
  eventoId?: string;
  setEventoId?: (value: string) => void;
  slugExists?: boolean;
  eventoData?: Evento | null;
  onEventoCriado?: (slug: string) => void;
}

export default function EventoForm({
  isEditing,
  eventoId,
  setEventoId,
  slugExists,
  eventoData,
  onEventoCriado
  }: EventoFormProps) {
    const router = useRouter();
    const [localSlug, setLocalSlug] = useState(eventoId || "");
    const [name, setName] = useState<string>(eventoData?.name || "");
    const [description, setDescription] = useState<string>(eventoData?.description || "");
    const [startDate, setStartDate] = useState<Date | string | null>(
      eventoData?.startDate ? formatDateInput(eventoData.startDate) : ""
    );
    const [endDate, setEndDate] = useState<Date | string | null>(
      eventoData?.endDate ? formatDateInput(eventoData.endDate) : ""
    );
    const [registrationDeadLine, setRegistrationDeadLine] = useState<Date | string | null>(
      eventoData?.registrationDeadLine ? formatDateInput(eventoData.registrationDeadLine) : ""
    );
    // allow to clean this fields
    // const [maxParticipants, setMaxParticipants] = useState<number>(eventoData?.maxParticipants || 0);
    const [maxParticipants, setMaxParticipants] = useState<string>(
      eventoData?.maxParticipants !== undefined ? String(eventoData.maxParticipants) : ""
    );
    // const [totalSessoes, setTotalSessoes] = useState<number>(eventoData?.totalSessoes || 0);
    const [totalSessoes, setTotalSessoes] = useState<string>(
      eventoData?.totalSessoes !== undefined ? String(eventoData.totalSessoes) : ""
    );
    // const [minAttendancePercentForCertificate, setMinAttendancePercentForCertificate] = useState<number>(
    //   eventoData?.minAttendancePercentForCertificate || 0
    // );
    const [minAttendancePercentForCertificate, setMinAttendancePercentForCertificate] = useState<string>(
    eventoData?.minAttendancePercentForCertificate !== undefined
      ? String(eventoData.minAttendancePercentForCertificate)
      : ""
  );

  const [status, setStatus] = useState<StatusEvento>(eventoData?.status || "aberto");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState(
    endDate ? formatDateToBrazilianDateTime(endDate) : ""
  );
  const [registrationDeadLineInput, setRegistrationDeadLineInput] = useState(
    registrationDeadLine ? formatDateToBrazilianDateTime(registrationDeadLine) : ""
  );

  // start to use for Brasilian mask
  useEffect(() => {
    if (startDate) {
      const parsed = new Date(startDate);
      const dia = String(parsed.getDate()).padStart(2, "0");
      const mes = String(parsed.getMonth() + 1).padStart(2, "0");
      const ano = parsed.getFullYear();
      const hora = String(parsed.getHours()).padStart(2, "0");
      const minuto = String(parsed.getMinutes()).padStart(2, "0");

      setStartDateInput(`${dia}/${mes}/${ano} ${hora}:${minuto}`);
    }
  }, [startDate]);

  // Atualiza o estado local quando a prop eventoId muda
  useEffect(() => {
    setLocalSlug(eventoId || "");
  }, [eventoId]);

  // Reseta o formulário quando não estiver em modo de edição
  useEffect(() => {
    if (!isEditing) {
      setName("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setRegistrationDeadLine("");
      setMaxParticipants("0");
      setTotalSessoes("0");
      setMinAttendancePercentForCertificate("0");
      setStatus("aberto");
    }
  }, [isEditing]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setLocalSlug(input);
    if (setEventoId) setEventoId(input);
  };

  const handleSlugBlur = () => {
    const slug = slugify(localSlug, {
      lower: true,
      strict: false,
      remove: /[*+~.()'"!:@]/g,
    });
    setLocalSlug(slug);
    if (setEventoId) setEventoId(slug);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("O nome do evento é obrigatório.");
      return;
    }

    if (!startDate || !endDate || !registrationDeadLine) {
      alert("Todas as datas são obrigatórias.");
      return;
    }

    if (isEditing && !eventoId) {
      alert("Erro interno: identificador do evento ausente.");
      return;
    }

    // allow to clean this fields
    const maxParticipantsNumber = Number(maxParticipants);
    if (isNaN(maxParticipantsNumber) || maxParticipantsNumber < 0) {
      alert("Informe um número válido para máximo de participantes");
      return;
    }

    const totalSessoesNumber = Number(totalSessoes);
      if (isNaN(totalSessoesNumber) || totalSessoesNumber < 0) {
        alert("Informe um número válido para total de sessões");
        return;
      }

    const minAttendanceNumber = Number(minAttendancePercentForCertificate);
      if (isNaN(minAttendanceNumber) || minAttendanceNumber < 0 || minAttendanceNumber > 100) {
        alert("Informe um número válido entre 0 e 100 para presença mínima para certificado");
        return;
      }

    const data: Evento | EventoSemId = {
      ...(isEditing && eventoData?.id && { id: eventoData.id }),
      name: name.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadLine: new Date(registrationDeadLine),
      maxParticipants: maxParticipantsNumber,
      totalSessoes: totalSessoesNumber,
      minAttendancePercentForCertificate: minAttendanceNumber,
      status,
      registrationsCount: eventoData?.registrationsCount || 0,
      sessions: eventoData?.sessions || []
    };

    setIsSubmitting(true);

    try {
      if (isEditing && eventoId) {
        const eventoRef = doc(db, "eventos", eventoId);
        await updateDoc(eventoRef, data);
        alert("Evento atualizado com sucesso.");
        router.refresh();
      } else {
        const novoSlug = localSlug.trim() || slugify(name, { lower: true, strict: true });
        const eventoRef = doc(db, "eventos", novoSlug);
        await setDoc(eventoRef, { ...data, id: novoSlug });

        if (onEventoCriado) {
          onEventoCriado(novoSlug); // 👈 sinaliza para o pai que o evento foi criado
        }

        alert("Evento criado com sucesso.");
        router.replace(`/eventos/admin/${novoSlug}`);
      }
    } catch (error) {
      console.error("Erro ao salvar o evento:", error);
      alert("Erro ao salvar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="evento-form">
      {!isEditing && setEventoId && (
        <div className="form-group">
          <label>Nome no link da página:</label>
          <input
            type="text"
            value={localSlug}
            onChange={handleSlugChange}
            onBlur={handleSlugBlur}
            required
            className="form-input"
          />
          {slugExists && <p className="form-error">Esse nome já está em uso.</p>}
          <small>O link da página será assim: https://matematica-ufdpar.vercel.app/eventos/<span className="example-url">nome-no-link</span></small>
        </div>
      )}
      <div className="form-group">
        <label>Título:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Descrição:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="form-input"
        />
      </div>

      <div className="eventDates">
        <div className="form-group">
          Datas e horários do evento no formato <span className="date-format-hint">(DD/MM/AAAA 00:00)</span>
        </div>

        <div className="form-group-dates">
          <div className="form-group form-group-dates-item">
            <label>Início:</label>
            <IMaskInput
              mask="00/00/0000 00:00"
              placeholder="dd/mm/aaaa hh:mm"
              value={startDateInput}
              onAccept={(value: string) => {
                if (value === startDateInput) return; // evita loop infinito
                setStartDateInput(value);

                const [datePart, timePart] = value.split(" ");
                if (!datePart || !timePart) {
                  setStartDate(null);
                  return;
                }

                const [day, month, year] = datePart.split("/");
                const [hour, minute] = timePart.split(":");

                const localDate = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day),
                  Number(hour),
                  Number(minute)
                );

                if (!isNaN(localDate.getTime())) {
                  setStartDate(localDate);
                } else {
                  setStartDate(null);
                }
              }}
              className="form-input"
              required
              lazy={false}
            />
          </div>

          <div className="form-group form-group-dates-item">
            <label>Término:</label>
            <IMaskInput
              mask="00/00/0000 00:00"
              placeholder="dd/mm/aaaa hh:mm"
              value={endDateInput}
              onAccept={(value: string) => {
                if (value === endDateInput) return;
                setEndDateInput(value);

                const [datePart, timePart] = value.split(" ");
                if (!datePart || !timePart) {
                  setEndDate(null);
                  return;
                }

                const [day, month, year] = datePart.split("/");
                const [hour, minute] = timePart.split(":");

                const localDate = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day),
                  Number(hour),
                  Number(minute)
                );

                if (!isNaN(localDate.getTime())) {
                  setEndDate(localDate);
                } else {
                  setEndDate(null);
                }
              }}
              className="form-input"
              required
              lazy={false}
            />
          </div>

          <div className="form-group form-group-dates-item">
            <label>Fim das inscrições:</label>
            <IMaskInput
              mask="00/00/0000 00:00"
              placeholder="dd/mm/aaaa hh:mm"
              value={registrationDeadLineInput}
              onAccept={(value: string) => {
                if (value === registrationDeadLineInput) return;
                setRegistrationDeadLineInput(value);

                const [datePart, timePart] = value.split(" ");
                if (!datePart || !timePart) {
                  setRegistrationDeadLine(null);
                  return;
                }

                const [day, month, year] = datePart.split("/");
                const [hour, minute] = timePart.split(":");

                const localDate = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day),
                  Number(hour),
                  Number(minute)
                );

                if (!isNaN(localDate.getTime())) {
                  setRegistrationDeadLine(localDate);
                } else {
                  setRegistrationDeadLine(null);
                }
              }}
              className="form-input"
              required
              lazy={false}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Máximo de participantes:</label>
        <input
          type="number"
          value={maxParticipants}
          // onChange={(e) => setMaxParticipants(Number(e.target.value))}
          onChange={(e) => {
            const val = e.target.value;
            // Permitir apenas números positivos ou vazio
            if (val === "" || /^[0-9\b]+$/.test(val)) {
              setMaxParticipants(val);
            }
          }}
          required
          min={0}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Total de sessões:</label>
        <input
          type="number"
          value={totalSessoes}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^[0-9\b]+$/.test(val)) {
              setTotalSessoes(val);
            }
          }}
          required
          min={0}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Presença mínima para certificado (0% - 100%):</label>
        <input
          type="number"
          value={minAttendancePercentForCertificate}
          onChange={(e) => {
            const val = e.target.value;
            // Permite vazio ou números entre 0 e 100
            if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0 && Number(val) <= 100)) {
              setMinAttendancePercentForCertificate(val);
            }
          }}
          required
          min={0}
          max={100}
          step={1}
          className="form-input"
        />
        <small className="presenca-minima-hint">Digite a porcentagem mínima de presença necessária para emitir o certificado (ex: 75).</small>
      </div>

      <div className="form-group">
        <label>Status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusEvento)}
          className="form-input"
        >
          <option value="aberto">Aberto</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>

      <div className="form-buttons">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-button ${isEditing ? "editing" : "creating"}`}
        >
          {isSubmitting
            ? isEditing
              ? "salvando..."
              : "criando..."
            : isEditing
            ? "salvar alterações"
            : "criar evento"}
        </button>

        <button
          type="button"
          onClick={() => router.push('/eventos/admin')}
          className="cancel-button"
        >
          voltar
        </button>
      </div>
    </form>
  );
}

// Funções auxiliares mantidas fora do componente
function formatDateToInput(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function parseInputToDateStr(input: string): string {
  const date = new Date(input);
  return date.toISOString();
}