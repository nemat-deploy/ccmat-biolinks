import type { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseTimestamp } from '@/lib/utils';
import EventoClientContent from './EventoClientContent';

type Evento = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate: any;
  endDate: any;
  registrationDeadLine: any;
  maxParticipants: number;
  registrationsCount: number;
  status: string;
  minAttendancePercentForCertificate: number;
};

// A função getEvento permanece a mesma
async function getEvento(id: string): Promise<Evento | null> {
  const eventoRef = doc(db, 'eventos', id);
  const eventoSnap = await getDoc(eventoRef);

  if (!eventoSnap.exists()) {
    return null;
  }
  
  const data = eventoSnap.data();
  return {
    id: eventoSnap.id,
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationDeadLine: data.registrationDeadLine,
    maxParticipants: data.maxParticipants ?? 0,
    registrationsCount: data.registrationsCount ?? 0,
    status: data.status || 'aberto',
    minAttendancePercentForCertificate: data.minAttendancePercentForCertificate ?? 80,
  };
}

// AJUSTE 1: A assinatura agora recebe as props como uma Promise
export async function generateMetadata(
  props: Promise<{ params: { id: string } }>
): Promise<Metadata> {
  // Usamos 'await' para resolver a Promise e obter os parâmetros
  const { params } = await props;
  const evento = await getEvento(params.id);

  if (!evento) {
    return { title: 'Evento não encontrado' };
  }
  
  const firstSentence = evento.description.replace(/<[^>]*>?/gm, '').split('. ')[0];

  return {
    title: evento.name,
    description: `Detalhes e inscrição para o evento: ${evento.name}`,
    openGraph: {
      title: evento.name,
      description: firstSentence,
      images: [
        {
          url: evento.imageUrl || 'https://matematica-ufdpar.vercel.app/images/logo-app-eventos-og.png',
          width: 1200,
          height: 630,
          alt: `Banner do evento ${evento.name}`,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
    },
  };
}

// AJUSTE 2: A mesma lógica é aplicada ao componente da página
export default async function EventoPage(
  props: Promise<{ params: { id: string } }>
) {
  // Usamos 'await' para resolver a Promise e obter os parâmetros
  const { params } = await props;
  const evento = await getEvento(params.id);

  if (!evento) {
    return <p className="loadingEvents">Evento não encontrado.</p>;
  }

  const serializableEvento = {
    ...evento,
    startDate: parseTimestamp(evento.startDate)?.toISOString() || new Date(0).toISOString(),
    endDate: parseTimestamp(evento.endDate)?.toISOString() || new Date(0).toISOString(),
    registrationDeadLine: parseTimestamp(evento.registrationDeadLine)?.toISOString() || new Date(0).toISOString(),
  };

  return <EventoClientContent initialEvento={serializableEvento} />;
}