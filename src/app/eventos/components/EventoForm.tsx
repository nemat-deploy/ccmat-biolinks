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

interface EventoFormProps {
  isEditing: boolean;
  eventoId?: string;
  setEventoId?: (value: string) => void;
  slugExists?: boolean;
  eventoData?: Evento | null;
}

export default function EventoForm({
  isEditing,
  eventoId,
  setEventoId,
  slugExists,
  eventoData,
}: EventoFormProps) {
  const router = useRouter();
  const [localSlug, setLocalSlug] = useState(eventoId || "");
  const [name, setName] = useState<string>(eventoData?.name || "");
  const [description, setDescription] = useState<string>(eventoData?.description || "");
  const [startDate, setStartDate] = useState<string>(eventoData?.startDate ? formatDateInput(eventoData.startDate) : "");
  const [endDate, setEndDate] = useState<string>(eventoData?.endDate ? formatDateInput(eventoData.endDate) : "");
  const [registrationDeadLine, setRegistrationDeadLine] = useState<string>(
    eventoData?.registrationDeadLine ? formatDateInput(eventoData.registrationDeadLine) : ""
  );
  const [maxParticipants, setMaxParticipants] = useState<number>(eventoData?.maxParticipants || 0);
  const [totalSessoes, setTotalSessoes] = useState<number>(eventoData?.totalSessoes || 0);
  const [minAttendancePercentForCertificate, setMinAttendancePercentForCertificate] = useState<number>(
    eventoData?.minAttendancePercentForCertificate || 0
  );
  const [status, setStatus] = useState<StatusEvento>(eventoData?.status || "aberto");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setMaxParticipants(0);
      setTotalSessoes(0);
      setMinAttendancePercentForCertificate(0);
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

    const data: Evento | EventoSemId = {
      ...(isEditing && eventoData?.id && { id: eventoData.id }),
      name: name.trim(),
      description: description.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationDeadLine: new Date(registrationDeadLine),
      maxParticipants,
      totalSessoes,
      minAttendancePercentForCertificate,
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
          <label>Slug (será usado na URL do evento):</label>
          <input
            type="text"
            value={localSlug}
            onChange={handleSlugChange}
            onBlur={handleSlugBlur}
            required
            className="form-input"
          />
          {slugExists && <p className="form-error">Esse slug já está em uso.</p>}
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

      <div className="form-group">
        <label>Data de Início (formato MêS/Dia/Ano) e hora:</label>
        <input
          type="datetime-local"
          value={startDate ? formatDateToInput(startDate) : ""}
          onChange={(e) => setStartDate(parseInputToDateStr(e.target.value))}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Data de Término (formato MêS/Dia/Ano) e hora:</label>
        <input
          type="datetime-local"
          value={endDate ? formatDateToInput(endDate) : ""}
          onChange={(e) => setEndDate(parseInputToDateStr(e.target.value))}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Data limite de inscrição (formato MêS/Dia/Ano) e hora:</label>
        <input
          type="datetime-local"
          value={registrationDeadLine ? formatDateToInput(registrationDeadLine) : ""}
          onChange={(e) => setRegistrationDeadLine(parseInputToDateStr(e.target.value))}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Máximo de participantes:</label>
        <input
          type="number"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Number(e.target.value))}
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
          onChange={(e) => setTotalSessoes(Number(e.target.value))}
          required
          min={0}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>% mínima de presença para certificado:</label>
        <input
          type="number"
          value={minAttendancePercentForCertificate}
          onChange={(e) => setMinAttendancePercentForCertificate(Number(e.target.value))}
          required
          min={0}
          max={100}
          step={1}
          className="form-input"
        />
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

      <button
        type="submit"
        disabled={isSubmitting}
        className={`submit-button ${isEditing ? "editing" : "creating"}`}
      >
        {isSubmitting
          ? isEditing
            ? "Salvando..."
            : "Criando..."
          : isEditing
          ? "Salvar alterações"
          : "Criar evento"}
      </button>
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