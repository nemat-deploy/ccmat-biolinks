// src/lib/firebasePresence.ts

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function checkAndIssueCertificate(eventId: string, cpf: string) {
  try {
    const eventRef = doc(db, "events", eventId);
    const participantRef = doc(db, "participants", cpf);

    const eventSnap = await getDoc(eventRef);
    const participantSnap = await getDoc(participantRef);

    if (!eventSnap.exists() || !participantSnap.exists()) return;

    const eventData = eventSnap.data();
    const participantData = participantSnap.data();

    const minPercent = eventData.minAttendancePercentForCertificate || 80;
    const totalAulas = eventData.attendanceDates?.length || 0; // datas das aulas (opcional)
    const totalPresencas = (participantData.attendances || []).filter(Boolean).length;

    if (totalAulas === 0) {
      alert("⚠️ Defina as datas das aulas no evento para calcular corretamente.");
      return;
    }

    const percentual = (totalPresencas / totalAulas) * 100;

    if (percentual >= minPercent) {
      await updateDoc(participantRef, {
        certificateIssued: true
      });
      
      console.log(`✅ Certificado emitido para ${cpf}`);
    }
  } catch (err) {
    console.error("Erro ao verificar certificado:", err);
  }
}