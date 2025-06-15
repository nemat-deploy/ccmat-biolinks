// src/app/api/atualizar-atividade-final/route.ts
import { NextRequest } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const { eventoId, participantId } = await req.json();

    if (!eventoId || !participantId) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados inválidos." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const participantRef = doc(db, "eventos", eventoId, "inscricoes", participantId);
    const snapshot = await getDoc(participantRef);

    if (!snapshot.exists()) {
      return new Response(
        JSON.stringify({ success: false, error: "Participante não encontrado." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const currentStatus = snapshot.data().enviou_atividade_final ?? false;

    // Atualiza o campo no Firestore
    await updateDoc(participantRef, {
      enviou_atividade_final: !currentStatus,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro ao atualizar atividade final:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno no servidor." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}