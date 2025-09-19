// src/app/eventos/components/EventoForm.tsx

"use client";

import { useEffect, useState, FormEvent } from "react";
import { doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseAuth";
import { Evento, EventoSemId, StatusEvento, Usuario } from "@/types";
import slugify from "slugify";
import "./EventoForm.css";
import { format, parseISO } from 'date-fns';
import { IMaskInput } from 'react-imask';
import { formatDateToBrazilianDateTime } from '@/utils/dateUtils';

// Suas funções de data originais mantidas
const parseDateString = (value: string): Date | null => {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  const localDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return isNaN(localDate.getTime()) ? null : localDate;
};

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
  
  // Estados do formulário original
  const [localSlug, setLocalSlug] = useState(eventoId || "");
  const [name, setName] = useState<string>(eventoData?.name || "");
  const [description, setDescription] = useState<string>(eventoData?.description || "");
  const [startDate, setStartDate] = useState<Date | null>(eventoData?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(eventoData?.endDate || null);
  const [registrationDeadLine, setRegistrationDeadLine] = useState<Date | null>(eventoData?.registrationDeadLine || null);
  const [maxParticipants, setMaxParticipants] = useState<string>(eventoData?.maxParticipants?.toString() || "");
  const [totalSessoes, setTotalSessoes] = useState<string>(eventoData?.totalSessoes?.toString() || "");
  const [minAttendancePercentForCertificate, setMinAttendancePercentForCertificate] = useState<string>(eventoData?.minAttendancePercentForCertificate?.toString() || "60");
  const [status, setStatus] = useState<StatusEvento>(eventoData?.status || "aberto");
  const [requerAtividadeFinal, setRequerAtividadeFinal] = useState<boolean>(eventoData?.requer_atividade_final ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para inputs com máscara
  const [startDateInput, setStartDateInput] = useState(eventoData?.startDate ? formatDateToBrazilianDateTime(eventoData.startDate) : '');
  const [endDateInput, setEndDateInput] = useState(eventoData?.endDate ? formatDateToBrazilianDateTime(eventoData.endDate) : '');
  const [registrationDeadLineInput, setRegistrationDeadLineInput] = useState(eventoData?.registrationDeadLine ? formatDateToBrazilianDateTime(eventoData.registrationDeadLine) : '');

  // ✅ NOVO: Estados para gerenciar coadmins
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminLoading, setAdminLoading] = useState(true);

  // Seus useEffects originais, preservados e combinados
  useEffect(() => {
    if (isEditing && eventoData) {
      setLocalSlug(eventoData.id || "");
      setName(eventoData.name);
      setDescription(eventoData.description);
      setStartDate(eventoData.startDate);
      setEndDate(eventoData.endDate);
      setRegistrationDeadLine(eventoData.registrationDeadLine);
      setMaxParticipants(eventoData.maxParticipants?.toString() || "");
      setTotalSessoes(eventoData.totalSessoes?.toString() || "");
      setMinAttendancePercentForCertificate(eventoData.minAttendancePercentForCertificate?.toString() || "60");
      setStatus(eventoData.status);
      setRequerAtividadeFinal(eventoData.requer_atividade_final ?? false);
      setStartDateInput(eventoData.startDate ? formatDateToBrazilianDateTime(eventoData.startDate) : '');
      setEndDateInput(eventoData.endDate ? formatDateToBrazilianDateTime(eventoData.endDate) : '');
      setRegistrationDeadLineInput(eventoData.registrationDeadLine ? formatDateToBrazilianDateTime(eventoData.registrationDeadLine) : '');
    } else {
      // Reset para formulário de criação
      setName("");
      setDescription("");
      setStartDate(null);
      setEndDate(null);
      setRegistrationDeadLine(null);
      setMaxParticipants("0");
      setTotalSessoes("0");
      setMinAttendancePercentForCertificate("60");
      setStatus("aberto");
      setRequerAtividadeFinal(false);
      setAdmins([]);
      setStartDateInput('');
      setEndDateInput('');
      setRegistrationDeadLineInput('');
    }
  }, [isEditing, eventoData]);

  // ✅ NOVO: Efeito para buscar os dados dos admins atuais do evento
  useEffect(() => {
    const fetchAdminsData = async () => {
      setAdminLoading(true);
      // Se estiver editando e houver admins no eventoData
      if (isEditing && eventoData?.admins && eventoData.admins.length > 0) {
        try {
          const adminPromises = eventoData.admins.map(adminId => getDoc(doc(db, "users", adminId)));
          const adminDocs = await Promise.all(adminPromises);
          const adminsList = adminDocs
            .filter(docSnap => docSnap.exists())
            .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Usuario));
          setAdmins(adminsList);
        } catch (error) {
          console.error("Erro ao buscar dados dos administradores:", error);
        }
      } else if (!isEditing) {
        // Se estiver criando um novo evento, adiciona o usuário atual como primeiro admin
        const currentUser = auth.currentUser;
        if(currentUser) {
          const creatorAsAdmin: Usuario = {
            id: currentUser.uid,
            email: currentUser.email || 'N/A',
            nome: currentUser.displayName || 'Criador',
            role: 'user' // role aqui é apenas para preencher o tipo
          };
          setAdmins([creatorAsAdmin]);
        }
      }
      setAdminLoading(false);
    };

    fetchAdminsData();
  }, [isEditing, eventoData]);
  
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
    const user = auth.currentUser;
    if (!user) {
      alert("Você precisa estar logado para salvar um evento.");
      return;
    }
    
    if (!name.trim() || !startDate || !endDate || !registrationDeadLine) {
      alert("Título e todas as datas são obrigatórios.");
      return;
    }

    const adminIds = admins.map(admin => admin.id);

    const data: Omit<Evento, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      registrationDeadLine,
      maxParticipants: Number(maxParticipants) || 0,
      totalSessoes: Number(totalSessoes) || 0,
      minAttendancePercentForCertificate: Number(minAttendancePercentForCertificate) || 0,
      status,
      registrationsCount: eventoData?.registrationsCount || 0,
      sessions: eventoData?.sessions || [],
      requer_atividade_final: requerAtividadeFinal,
      createdBy: eventoData?.createdBy || user.uid,
      admins: adminIds.length > 0 ? adminIds : [user.uid],
    };

    setIsSubmitting(true);
    try {
      if (isEditing && eventoId) {
        const eventoRef = doc(db, "eventos", eventoId);
        await updateDoc(eventoRef, data);
        alert("Evento atualizado com sucesso.");
        router.push('/eventos/admin');
      } else {
        const novoSlug = localSlug.trim() || slugify(name, { lower: true, strict: true });
        const eventoRef = doc(db, "eventos", novoSlug);
        
        const finalData = { 
          ...data, 
          id: novoSlug, 
          createdBy: user.uid,
        };
        
        await setDoc(eventoRef, finalData);
        
        if (onEventoCriado) {
          onEventoCriado(novoSlug);
        }

        alert("Evento criado com sucesso.");
        router.push(`/eventos/admin`);
      }
    } catch (error) {
      console.error("Erro detalhado ao salvar o evento:", error);
      let errorMessage = "Erro ao salvar o evento.";
      if (error instanceof Error) {
        errorMessage += `\n\nDetalhes: ${error.message}`;
      }
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert("Por favor, insira um email.");
      return;
    }
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", newAdminEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Nenhum usuário encontrado com este email.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const newAdmin = { id: userDoc.id, ...userDoc.data() } as Usuario;

      if (admins.some(admin => admin.id === newAdmin.id)) {
        alert("Este usuário já é um administrador do evento.");
        return;
      }

      setAdmins([...admins, newAdmin]);
      setNewAdminEmail('');
    } catch (error) {
      console.error("Erro ao adicionar administrador:", error);
      alert("Ocorreu um erro ao buscar o usuário.");
    }
  };

  const handleRemoveAdmin = (adminId: string) => {
    if (eventoData?.createdBy === adminId) {
      alert("O criador original do evento não pode ser removido.");
      return;
    }
    if (admins.length <= 1) {
      alert("O evento deve ter pelo menos um administrador.");
      return;
    }
    setAdmins(admins.filter(admin => admin.id !== adminId));
  };

  const handleDateChange = (value: string, setter: (date: Date | null) => void) => {
    const parsedDate = parseDateString(value);
    if (parsedDate) {
        setter(parsedDate);
    } else if (value.replace(/[_\s/:]/g, '').length < 14) {
        setter(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="evento-form">
      {!isEditing && setEventoId && (
        <div className="form-group">
          <label>Nome no link da página:</label>
          <input type="text" value={localSlug} onChange={handleSlugChange} onBlur={handleSlugBlur} required className="form-input" />
          {slugExists && <p className="form-error">Esse nome já está em uso.</p>}
          <small>O link da página será assim: https://matematica-ufdpar.vercel.app/eventos/<span className="example-url">nome-no-link</span></small>
        </div>
      )}
      <div className="form-group">
        <label>Título:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="form-input" />
      </div>
      <div className="form-group">
        <label>Descrição:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="form-input" />
      </div>

      <div className="eventDates">
        <div className="form-group">Datas e horários do evento no formato <span className="date-format-hint">(DD/MM/AAAA 00:00)</span></div>
        <div className="form-group-dates">
          <div className="form-group form-group-dates-item">
            <label>Início:</label>
            <IMaskInput mask="00/00/0000 00:00" placeholder="dd/mm/aaaa hh:mm" value={startDateInput} onAccept={(value: any) => { setStartDateInput(value); handleDateChange(value, setStartDate); }} className="form-input-date" required lazy={false} />
          </div>
          <div className="form-group form-group-dates-item">
            <label>Término:</label>
            <IMaskInput mask="00/00/0000 00:00" placeholder="dd/mm/aaaa hh:mm" value={endDateInput} onAccept={(value: any) => { setEndDateInput(value); handleDateChange(value, setEndDate); }} className="form-input-date" required lazy={false} />
          </div>
          <div className="form-group form-group-dates-item">
            <label>Fim das inscrições:</label>
            <IMaskInput mask="00/00/0000 00:00" placeholder="dd/mm/aaaa hh:mm" value={registrationDeadLineInput} onAccept={(value: any) => { setRegistrationDeadLineInput(value); handleDateChange(value, setRegistrationDeadLine); }} className="form-input-date" required lazy={false} />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Máximo de participantes:</label>
        <input
          type="number"
          value={maxParticipants}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^[0-9\b]+$/.test(val)) {
              setMaxParticipants(val);
            }
          }}
          required min={0} className="form-input"
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
          required min={0} className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Presença mínima para certificado (%):</label>
        <input
          type="number"
          value={minAttendancePercentForCertificate}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || (/^\d+$/.test(val) && Number(val) >= 0 && Number(val) <= 100)) {
              setMinAttendancePercentForCertificate(val);
            }
          }}
          required min={0} max={100} step={1} className="form-input"
        />
        <small className="presenca-minima-hint">Digite um número entre 0 e 100.</small>
      </div>

      <div className="form-group">
        <label>Status:</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusEvento)} className="form-input">
          <option value="aberto">Aberto</option>
          <option value="encerrado">Encerrado</option>
        </select>
      </div>
      <div className="form-group">
        <label>
          <input type="checkbox" checked={requerAtividadeFinal} onChange={(e) => setRequerAtividadeFinal(e.target.checked)} />
          Requer atividade final
        </label>
      </div>
      
      {isEditing && (
        <div className="form-group-admins" style={{ border: '1px solid #BDBDBD', borderRadius: '8px', padding: '8px'}}>
          <h3 style={{ fontSize: '18px', marginTop: '4px' }}>Administradores do Evento</h3>
          {adminLoading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <ul className="admin-list" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {admins.map(admin => (
                  <li key={admin.id}>
                    <span>{admin.nome} ({admin.email})</span>
                    {admin.id !== eventoData?.createdBy && admins.length > 1 && (
                       <button type="button" onClick={() => handleRemoveAdmin(admin.id)} className="remove-admin-btn" style={{ marginLeft: '4px', backgroundColor: '#FCC6BB', borderRadius: '8px', border: 'none', padding: '2px 4px', cursor: 'pointer' }}>
                         Remover
                       </button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="add-admin-section" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <input 
                  type="email" 
                  value={newAdminEmail} 
                  onChange={(e) => setNewAdminEmail(e.target.value)} 
                  placeholder="Email do novo administrador" 
                  className="form-input" 
                  style={{ flexGrow: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddAdmin}
                  className="add-admin-btn"
                  style={{
                    padding: '4px 8px',
                    fontSize: '14px',
                    backgroundColor: '#e7f1ff',
                    color: '#0056b3',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    marginLeft: '10px'
                  }}
                >
                  + Adicionar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="form-buttons">
        <button type="submit" disabled={isSubmitting} className={`submit-button ${isEditing ? "editing" : "creating"}`}>
          {isSubmitting ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Evento")}
        </button>
        <button type="button" onClick={() => router.push('/eventos/admin')} className="cancel-button">
          Voltar
        </button>
      </div>
    </form>
  );
}

// Suas funções auxiliares originais mantidas
function formatDateToInput(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function parseInputToDateStr(input: string): string {
  const date = new Date(input);
  return date.toISOString();
}

