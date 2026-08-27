// src/app/eventos/components/EventoForm.tsx

"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
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

// Importações para o Tiptap e suas extensões
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';

// Importações para os ícones do FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBold, faItalic, faStrikethrough, faParagraph, 
  faListUl, faListOl, faHeading,
  faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify,
  faLink, faUnlink
} from '@fortawesome/free-solid-svg-icons';

// Suas funções de data originais mantidas
const parseDateString = (value: string): Date | null => {
  const [datePart, timePart] = value.split(" ");
  if (!datePart || !timePart) return null;
  const [day, month, year] = datePart.split("/");
  const [hour, minute] = timePart.split(":");
  const localDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return isNaN(localDate.getTime()) ? null : localDate;
};

// Componente da barra de ferramentas com os novos botões
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="tiptap-toolbar">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Negrito"><FontAwesomeIcon icon={faBold} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Itálico"><FontAwesomeIcon icon={faItalic} /></button>
      <button type="button" onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''} title="Adicionar Link"><FontAwesomeIcon icon={faLink} /></button>
      <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')} title="Remover Link"><FontAwesomeIcon icon={faUnlink} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Riscado"><FontAwesomeIcon icon={faStrikethrough} /></button>
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={editor.isActive('paragraph') ? 'is-active' : ''} title="Parágrafo"><FontAwesomeIcon icon={faParagraph} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''} title="Título 1">H1</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''} title="Título 2">H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Lista com marcadores"><FontAwesomeIcon icon={faListUl} /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Lista numerada"><FontAwesomeIcon icon={faListOl} /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Alinhar à Esquerda"><FontAwesomeIcon icon={faAlignLeft} /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Centralizar"><FontAwesomeIcon icon={faAlignCenter} /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Alinhar à Direita"><FontAwesomeIcon icon={faAlignRight} /></button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''} title="Justificar"><FontAwesomeIcon icon={faAlignJustify} /></button>
      <input
        type="color"
        onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        title="Cor do Texto"
        className="tiptap-color-picker"
      />
    </div>
  );
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
  
  // Estados do formulário
  const [localSlug, setLocalSlug] = useState("");
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [registrationDeadLine, setRegistrationDeadLine] = useState<Date | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [totalSessoes, setTotalSessoes] = useState<string>("");
  const [minAttendancePercentForCertificate, setMinAttendancePercentForCertificate] = useState<string>("60");
  const [status, setStatus] = useState<StatusEvento>("aberto");
  const [requerAtividadeFinal, setRequerAtividadeFinal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [registrationDeadLineInput, setRegistrationDeadLineInput] = useState('');
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminLoading, setAdminLoading] = useState(true);
  const [showImageTooltip, setShowImageTooltip] = useState(false);

  // Estados para o certificado
  const [certificateBgUrl, setCertificateBgUrl] = useState<string>("");
  const [cargaHoraria, setCargaHoraria] = useState<string>("");
  const [certificateText, setCertificateText] = useState<string>("");
  const [liberarCertificados, setLiberarCertificados] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color.configure({ types: [TextStyle.name] }),
    ],
    content: description,
    immediatelyRender: false,
    onUpdate: ({ editor }) => { setDescription(editor.getHTML()); },
    editorProps: {
      attributes: { class: 'tiptap-editor', placeholder: 'Descreva o evento...' },
    },
  });

  const certEditor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color.configure({ types: [TextStyle.name] }),
    ],
    content: certificateText,
    immediatelyRender: false,
    onUpdate: ({ editor }) => { setCertificateText(editor.getHTML()); },
    editorProps: {
      attributes: { class: 'tiptap-editor', placeholder: 'Digite o texto modelo do certificado...' },
    },
  });

  // Efeito para preencher o formulário
  useEffect(() => {
    const currentUserEmail = auth.currentUser?.email || "";
    if (isEditing && eventoData) {
      setLocalSlug(eventoData.id || "");
      setName(eventoData.name);
      setDescription(eventoData.description);
      setImageUrl(eventoData.imageUrl || "");
      // ✅ CORREÇÃO: No modo de edição, mostra o que está salvo (ou vazio), sem usar o email do usuário como fallback.
      setContactEmail(eventoData.contactEmail || "");
      setContactPhone(eventoData.contactPhone || "");
      setStartDate(eventoData.startDate);
      setEndDate(eventoData.endDate);
      setRegistrationDeadLine(eventoData.registrationDeadLine);
      setMaxParticipants(eventoData.maxParticipants?.toString() || "");
      setTotalSessoes(eventoData.totalSessoes?.toString() || "");
      setMinAttendancePercentForCertificate(eventoData.minAttendancePercentForCertificate?.toString() || "60");
      setStatus(eventoData.status);
      setRequerAtividadeFinal(eventoData.requer_atividade_final ?? false);
      setCertificateBgUrl(eventoData.certificateBgUrl || "");
      setCargaHoraria(eventoData.cargaHoraria?.toString() || "");
      setCertificateText(eventoData.certificateText || "");
      setLiberarCertificados(eventoData.liberarCertificados === true);
      setStartDateInput(eventoData.startDate ? formatDateToBrazilianDateTime(eventoData.startDate) : '');
      setEndDateInput(eventoData.endDate ? formatDateToBrazilianDateTime(eventoData.endDate) : '');
      setRegistrationDeadLineInput(eventoData.registrationDeadLine ? formatDateToBrazilianDateTime(eventoData.registrationDeadLine) : '');
      if (editor && eventoData.description !== editor.getHTML()) {
        editor.commands.setContent(eventoData.description);
      }
      if (certEditor && eventoData.certificateText && eventoData.certificateText !== certEditor.getHTML()) {
        certEditor.commands.setContent(eventoData.certificateText);
      }
    } else {
      // No modo de criação, define o email do usuário como padrão.
      setName("");
      setDescription("");
      setImageUrl("");
      setCertificateBgUrl("");
      setCargaHoraria("");
      setCertificateText("");
      setLiberarCertificados(false);
      setContactEmail(currentUserEmail);
      setContactPhone("");
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
      editor?.commands.clearContent();
      certEditor?.commands.clearContent();
    }
  }, [isEditing, eventoData, editor, certEditor]);

  // (O restante do código, como useEffects e handles, permanece igual)
  useEffect(() => {
    const fetchAdminsData = async () => {
      setAdminLoading(true);
      if (isEditing && eventoData?.admins && eventoData.admins.length > 0) {
        try {
          const adminPromises = eventoData.admins.map(adminId => getDoc(doc(db, "users", adminId)));
          const adminDocs = await Promise.all(adminPromises);
          const adminsList = adminDocs.filter(docSnap => docSnap.exists()).map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Usuario));
          setAdmins(adminsList);
        } catch (error) { console.error("Erro ao buscar admins:", error); }
      } else if (!isEditing) {
        const currentUser = auth.currentUser;
        if(currentUser) {
          setAdmins([{ id: currentUser.uid, email: currentUser.email || 'N/A', nome: currentUser.displayName || 'Criador', role: 'user' }]);
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
    const slug = slugify(localSlug, { lower: true, strict: false, remove: /[*+~.()'"!:@]/g });
    setLocalSlug(slug);
    if (setEventoId) setEventoId(slug);
  };

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { alert("Você precisa estar logado."); return; }
    if (!name.trim() || !startDate || !endDate || !registrationDeadLine) { alert("Título e datas são obrigatórios."); return; }

    const adminIds = admins.map(admin => admin.id);

    const data: Omit<Evento, 'id'> = {
      name: name.trim(),
      description: description,
      imageUrl: imageUrl.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.replace(/\D/g, ''),
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
      certificateBgUrl: certificateBgUrl.trim(),
      cargaHoraria: Number(cargaHoraria) || 0,
      certificateText: certificateText,
      liberarCertificados: liberarCertificados,
    };

    setIsSubmitting(true);
    try {
      if (isEditing && eventoId) {
        // MODO EDIÇÃO: Não redireciona após o salvamento
        await updateDoc(doc(db, "eventos", eventoId), data);
        alert("Evento atualizado com sucesso.");
      } else {
        // MODO CRIAÇÃO: Redireciona para a página administrativa do novo evento
        const novoSlug = localSlug.trim() || slugify(name, { lower: true, strict: true });
        await setDoc(doc(db, "eventos", novoSlug), { ...data, id: novoSlug, createdBy: user.uid });
        if (onEventoCriado) onEventoCriado(novoSlug);
        alert("Evento criado com sucesso.");
        
        // Redireciona para o novo evento
        router.push(`/eventos/admin/${novoSlug}`); 
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) { alert("Insira um email."); return; }
    try {
      const q = query(collection(db, "users"), where("email", "==", newAdminEmail.trim()));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { alert("Usuário não encontrado."); return; }
      const newAdmin = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Usuario;
      if (admins.some(admin => admin.id === newAdmin.id)) { alert("Usuário já é admin."); return; }
      setAdmins([...admins, newAdmin]);
      setNewAdminEmail('');
    } catch (error) { console.error("Erro ao adicionar admin:", error); alert("Erro ao buscar usuário."); }
  };

  const handleRemoveAdmin = (adminId: string) => {
    if (eventoData?.createdBy === adminId) { alert("O criador não pode ser removido."); return; }
    if (admins.length <= 1) { alert("O evento precisa de ao menos um admin."); return; }
    setAdmins(admins.filter(admin => admin.id !== adminId));
  };

  const handleDateChange = (value: string, setter: (date: Date | null) => void) => {
    const parsedDate = parseDateString(value);
    if (parsedDate) { setter(parsedDate); } 
    else if (value.replace(/[_\s/:]/g, '').length < 14) { setter(null); }
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
        <label><strong>Título:</strong></label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="form-input" />
      </div>
      
      <div className="form-group-inline">
        <div className="form-group">
          <label><strong>Email ou Link de Contato (Opcional):</strong></label>
          <input 
            type="text" 
            value={contactEmail} 
            onChange={(e) => setContactEmail(e.target.value)} 
            placeholder="contato@email.com ou https://seu-site.com/contato"
            className="form-input" 
          />
          <small>Pode ser um email ou um link para um formulário</small>
        </div>

        <div className="form-group">
          <label><strong>Telefone de Contato (Opcional):</strong></label>
          <IMaskInput
            mask="(00) 00000-0000"
            value={contactPhone}
            onAccept={(value: any) => setContactPhone(value)}
            placeholder="(99) 99999-9999"
            className="form-input"
          />
          <small>Este telefone também será exibido na página do evento</small>
        </div>
      </div>

      <div className="form-group">
        {/* Mantivemos os estilos de display e alinhamento da label aqui, pois controlam o layout da linha. */}
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'default' }}>
          <strong>URL da imagem do evento (opcional)</strong>
          <div
            style={{ position: 'relative', marginLeft: '8px', display: 'inline-flex' }}
            onMouseEnter={() => setShowImageTooltip(true)}
            onMouseLeave={() => setShowImageTooltip(false)}
          >
            {/* ÍCONE "i" - Usando a nova classe CSS */}
            <span className="info-icon">
              i
            </span>
            
            {/* TOOLTIP - Usando a nova classe CSS */}
            {showImageTooltip && (
              <div className="image-tooltip">
                Você pode usar o <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer">Postimage</a> ou <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer">imgbb</a> para hospedar sua imagem e pegar o Link Direto.
              </div>
            )}
          </div>
        </label>
        
        {/* Bloco do Input e Botão Remover (mantido como estava) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="url" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="Cole a URL da imagem aqui"
              className="form-input"
              style={{ flexGrow: 1 }}
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                style={{
                  padding: '8px 12px', backgroundColor: '#fbe9e7', color: '#c62828',
                  border: '1px solid #ffccbc', borderRadius: '6px', cursor: 'pointer',
                  fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                Remover
              </button>
            )}
        </div>
        <small>Tamanho ideal da imagem: 650x350px</small>
      </div>

      <div className="form-group">
        <label><strong>Descrição Detalhada:</strong></label>
        <div className="tiptap-container">
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="eventDates">
        <div className="form-group">Datas e horários do evento no formato <span className="date-format-hint">(dia/mês/ano 00:00)</span></div>
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

      <div className="form-group-inline">
        <div className="form-group">
          <label>Máximo de participantes:</label>
          <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} required min={0} className="form-input" />
        </div>
        <div className="form-group">
          <label>Total de sessões:</label>
          <input type="number" value={totalSessoes} onChange={(e) => setTotalSessoes(e.target.value)} required min={0} className="form-input" />
        </div>
      </div>

      <div className="form-group-inline">
        <div className="form-group">
          <label>Presença mínima para certificado (%):</label>
          <input type="number" value={minAttendancePercentForCertificate} onChange={(e) => setMinAttendancePercentForCertificate(e.target.value)} required min={0} max={100} step={1} className="form-input" />
          <small className="presenca-minima-hint">Digite um número entre 0 e 100.</small>
        </div>
        <div className="form-group">
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusEvento)} className="form-input">
            <option value="aberto">Aberto</option>
            <option value="fechado">Fechado</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>
          <input type="checkbox" checked={requerAtividadeFinal} onChange={(e) => setRequerAtividadeFinal(e.target.checked)} />
          Requer atividade final
        </label>
      </div>

      {/* --- Seção de Configuração do Certificado --- */}
      <div className="certificate-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1.2rem', color: '#2c5282', marginBottom: '1rem', fontWeight: '600' }}>📜 Configuração do Certificado</h3>

        {/* Toggle de Liberação de Certificados */}
        <div className="form-group" style={{ marginBottom: '1.25rem', padding: '12px 16px', backgroundColor: liberarCertificados ? '#f0fff4' : '#fff5f5', border: `1.5px solid ${liberarCertificados ? '#9ae6b4' : '#feb2b2'}`, borderRadius: '8px', transition: 'all 0.2s ease' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: liberarCertificados ? '#22543d' : '#742a2a', fontSize: '0.95rem' }}>
            <input 
              type="checkbox" 
              checked={liberarCertificados} 
              onChange={(e) => setLiberarCertificados(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>{liberarCertificados ? "✅ Emissão de certificados LIBERADA para os participantes" : "🔒 Emissão de certificados BLOQUEADA para os participantes"}</span>
          </label>
          <small style={{ display: 'block', marginTop: '4px', color: '#4a5568', fontSize: '0.85rem' }}>
            Quando bloqueado, os participantes verão a mensagem "Indisponível" na consulta pública de inscrições. No painel administrativo, o download sempre fica disponível para pré-visualização.
          </small>
        </div>
        
        <div className="form-group-inline">
          <div className="form-group">
            <label><strong>Carga Horária (em horas):</strong></label>
            <input 
              type="number" 
              value={cargaHoraria} 
              onChange={(e) => setCargaHoraria(e.target.value)} 
              min={0} 
              placeholder="Ex: 8"
              className="form-input" 
            />
            <small>Carga horária que substituirá a tag <code>{"{carga_horaria}"}</code></small>
          </div>

          <div className="form-group">
            <label><strong>URL da Imagem de Fundo do Certificado (Opcional):</strong></label>
            <input 
              type="url" 
              value={certificateBgUrl} 
              onChange={(e) => setCertificateBgUrl(e.target.value)} 
              placeholder="https://..." 
              className="form-input" 
            />
            <small>Link da arte A4 (com assinaturas e timbres gravados)</small>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label><strong>Modelo de Texto do Certificado:</strong></label>
          <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: '#4a5568', backgroundColor: '#ebf8ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bee3f8', lineHeight: '1.6' }}>
            <strong>Tags dinâmicas disponíveis (serão substituídas automaticamente ao gerar o PDF):</strong><br />
            <code>{"{nome}"}</code> • <code>{"{cpf}"}</code> • <code>{"{evento}"}</code> • <code>{"{data_inicio}"}</code> • <code>{"{data_fim}"}</code> • <code>{"{carga_horaria}"}</code>
          </div>
          <div className="tiptap-container">
            <MenuBar editor={certEditor} />
            <EditorContent editor={certEditor} />
          </div>
        </div>
      </div>
      
      {isEditing && (
        <div className="form-group-admins">
          <h3>Administradores do Evento</h3>
          {adminLoading ? <p>Carregando...</p> : (
            <>
              <ul className="admin-list" style={{ listStyleType: 'none', paddingLeft: 0, marginBottom: '30px' }}>
                {admins.map(admin => (
                  <li key={admin.id}>
                    <span>{admin.nome} ({admin.email})</span>
                    {admin.id !== eventoData?.createdBy && admins.length > 1 && (
                       <button type="button" onClick={() => handleRemoveAdmin(admin.id)} className="remove-admin-btn">Remover</button>
                    )}
                  </li>
                ))}
              </ul>
              <div className="add-admin-section" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} placeholder="email do novo administrador" className="form-input" style={{ flexGrow: 1 }} />
                <button type="button" onClick={handleAddAdmin} className="add-admin-btn" style={{ marginLeft: '10px' }}>+ Adicionar</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="form-buttons">
        <button type="submit" disabled={isSubmitting} className={`submit-button ${isEditing ? "editing" : "creating"}`}>
          {isSubmitting ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Evento")}
        </button>
        <button type="button" onClick={() => router.push('/eventos/admin')} className="cancel-button">Voltar</button>
      </div>
    </form>
  );
}

function formatDateToInput(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function parseInputToDateStr(input: string): string {
  const date = new Date(input);
  return date.toISOString();
}

