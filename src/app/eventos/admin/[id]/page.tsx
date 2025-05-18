"use client";

import { useEffect, useState, Fragment } from "react"; // Adicionei Fragment aqui
import { useParams, useRouter } from "next/navigation";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth, onAuthStateChanged } from "@/lib/firebaseAuth";
import Link from "next/link";
import './page.css'

export default function AdminEventoPage() {
  const params = useParams();
  const { id } = params;
  const [participantes, setParticipantes] = useState([]);
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verifica login e carrega dados
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/eventos/login");
      } else {
        await fetchEvento(id);
        await fetchParticipantes(id);
      }
    });

    return () => unsubscribe();
  }, [id]);

  // Busca evento
  async function fetchEvento(eventoId) {
    try {
      const eventoRef = doc(db, "eventos", eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (eventoSnap.exists()) {
        setEvento({
          id: eventoSnap.id,
          ...eventoSnap.data(),
        });
      } else {
        throw new Error("Evento não encontrado.");
      }
    } catch (err) {
      console.error("Erro ao buscar evento:", err);
    }
  }

  // Busca participantes
  async function fetchParticipantes(eventoId: string) {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, "participantes"),
        where("eventoId", "==", eventoId)
      );
      
      const querySnapshot = await getDocs(q);
      const participantesData: Participante[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        participantesData.push({
          id: doc.id,
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          institution: data.institution || "",
          eventoId: data.eventoId,
          dataInscricao: data.dataInscricao?.toDate() || null
        });
      });

      setParticipantes(participantesData);
      console.log(`Encontrados ${participantesData.length} participantes`);
      
    } catch (error) {
      console.error("Erro ao buscar participantes:", error);
      alert("Erro ao carregar lista de participantes");
    } finally {
      setLoading(false);
    }
  }

  // Exclui participante
  const handleDelete = async (cpf) => {
    if (!confirm("Tem certeza que deseja excluir este participante?")) return;

    try {
      await deleteDoc(doc(db, "participantes", cpf));
      setParticipantes(participantes.filter((p) => p.id !== cpf));
      alert("✅ Excluído com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao excluir:", err);
      alert("⚠️ Erro ao excluir participante.");
    }
  };

  // Estado para edição
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    institution: ""
  });

  // Inicia edição
  const startEdit = (participante) => {
    setEditingParticipant(participante.id);
    setEditForm({
      nome: participante.nome,
      email: participante.email,
      telefone: participante.telefone || "",
      institution: participante.institution || ""
    });
  };

  // Atualiza formulário de edição
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Salva edição
  const saveEdit = async () => {
    if (!editingParticipant) return;

    try {
      await updateDoc(doc(db, "participantes", editingParticipant), {
        nome: editForm.nome,
        email: editForm.email,
        telefone: editForm.telefone,
        institution: editForm.institution
      });

      // Atualiza a lista localmente
      setParticipantes(participantes.map(p => 
        p.id === editingParticipant ? { ...p, ...editForm } : p
      ));

      setEditingParticipant(null);
      alert("✅ Atualizado com sucesso!");
    } catch (err) {
      console.error("❌ Erro ao atualizar:", err);
      alert("⚠️ Erro ao salvar as alterações.");
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1 className="titleCourse">Admin - {evento?.name || id}</h1>
      <p className="totalInscritos">
        <strong>{participantes.length}</strong> participantes inscritos
      </p>

      {/* Tabela de participantes */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Nome</th>
            <th style={{ textAlign: "left" }}>CPF</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "left" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {participantes.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", fontStyle: "italic" }}>
                Nenhum participante encontrado.
              </td>
            </tr>
          ) : (
            participantes.map((p) => (
              <Fragment key={p.id}>
                <tr>
                  <td>{p.nome}</td>
                  <td>{p.id}</td>
                  <td>{p.email}</td>
                  <td>
                    <button
                      onClick={() => startEdit(p)}
                      style={{
                        marginRight: "0.5rem",
                        background: "#0070f3",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.8rem",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
                
                {/* Formulário de edição */}
                {editingParticipant === p.id && (
                  <tr>
                    <td colSpan={4}>
                      <div style={{
                        margin: "1rem 0",
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px"
                      }}>
                        <h3 style={{ fontWeight: "bold", marginBottom: "20px" }}>Editar Participante</h3>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <label>Nome: </label>
                          <input
                            type="text"
                            name="nome"
                            value={editForm.nome}
                            onChange={handleEditChange}
                            style={{ padding: "0.3rem", width: "100%", maxWidth: "400px", border: "1px solid #d3d3d3", borderRadius: "8px" }}
                          />
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <label>Email: </label>
                          <input
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleEditChange}
                            style={{ padding: "0.3rem", width: "100%", maxWidth: "400px", border: "1px solid #d3d3d3", borderRadius: "8px" }}
                          />
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <label>Telefone: </label>
                          <input
                            type="text"
                            name="telefone"
                            value={editForm.telefone}
                            onChange={handleEditChange}
                            style={{ padding: "0.3rem", width: "100%", maxWidth: "400px", border: "1px solid #d3d3d3", borderRadius: "8px" }}
                          />
                        </div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <label>Instituição: </label>
                          <input
                            type="text"
                            name="institution"
                            value={editForm.institution}
                            onChange={handleEditChange}
                            style={{ padding: "0.3rem", width: "100%", maxWidth: "400px", border: "1px solid #d3d3d3", borderRadius: "8px" }}
                          />
                        </div>
                        <button
                          onClick={saveEdit}
                          style={{
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "0.5rem"
                          }}
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingParticipant(null)}
                          style={{
                            background: "#6c757d",
                            color: "white",
                            border: "none",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))
          )}
        </tbody>
      </table>

      <br />
      <Link href="/eventos/admin" style={{ color: "#0070f3" }}>
        ← Voltar para eventos
      </Link>
    </div>
  );
}