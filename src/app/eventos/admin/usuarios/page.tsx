// src/app/eventos/admin/usuarios/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebaseAuth";
import { Inscricao } from "@/types"
import { Usuario } from "@/types"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null)

  const [editandoUid, setEditandoUid] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [busca, setBusca] = useState("");

  // Carrega dados do usuário logado e lista de usuários
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "/eventos/login";
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().isAdmin === true) {
        setUsuarioLogado({ id: snap.id, ...snap.data() } as Usuario);
        carregarUsuarios();
      } else {
        window.location.href = "/eventos/login";
      }
    });

    return () => unsubscribe();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const lista: Usuario[] = [];

      snapshot.forEach((doc) =>
        lista.push({
          id: doc.id,
          ...doc.data(),
        } as Usuario)
      );

      setUsuarios(lista);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const handleEditar = (usuario: Usuario) => {
    setEditandoUid(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setIsAdmin(usuario.isAdmin || false);
  };

  const handleSalvar = async () => {
    if (!editandoUid || !nome || !email) return;

    const userRef = doc(db, "users", editandoUid);

    try {
      await updateDoc(userRef, {
        nome,
        email,
        isAdmin,
      });

      setUsuarios(
        usuarios.map((u) =>
          u.id === editandoUid ? { ...u, nome, email, isAdmin } : u
        )
      );

      alert("✅ Usuário atualizado!");
      setEditandoUid(null);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("❌ Erro ao salvar as alterações.");
    }
  };

  const handleExcluir = async (id: string) => {
    if (!confirm("⚠️ Tem certeza que deseja excluir este usuário?")) return;

    try {
      await deleteDoc(doc(db, "users", id));
      setUsuarios(usuarios.filter((u) => u.id !== id));
      alert("🗑 Usuário excluído!");
    } catch (err) {
      console.error("Erro ao excluir:", err);
      alert("❌ Erro ao excluir usuário.");
    }
  };

  const filtrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Gestão de Usuários</h1>

      {/* Campo de busca */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: "100%",
            padding: "0.6rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Tabela de usuários */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid #ccc" }}>
            <th style={{ textAlign: "left" }}>Nome</th>
            <th style={{ textAlign: "left" }}>Email</th>
            <th style={{ textAlign: "center" }}>Admin</th>
            <th style={{ textAlign: "center" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((usuario) => (
            <tr key={usuario.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{usuario.nome}</td>
              <td>{usuario.email}</td>
              <td style={{ textAlign: "center" }}>
                {usuario.isAdmin ? "✅" : "❌"}
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  onClick={() => handleEditar(usuario)}
                  style={{
                    marginRight: "0.5rem",
                    background: "#fbbc05",
                    border: "none",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleExcluir(usuario.id)}
                  style={{
                    background: "#ea4335",
                    border: "none",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulário de edição */}
      {editandoUid && (
        <div style={{ marginTop: "3rem" }}>
          <h2>Editar Usuário</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSalvar();
            }}
          >
            <div>
              <label>
                Nome:
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    margin: "0.5rem 0 1rem",
                    padding: "0.5rem",
                  }}
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  readOnly
                  style={{
                    width: "100%",
                    margin: "0.5rem 0 1rem",
                    padding: "0.5rem",
                    backgroundColor: "#f9f9f9",
                  }}
                />
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  disabled={
                    editandoUid === auth.currentUser?.uid &&
                    usuarioLogado?.isAdmin
                  }
                />
                &nbsp;É administrador?
              </label>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button
                type="submit"
                style={{
                  background: "#4285F4",
                  color: "white",
                  border: "none",
                  padding: "0.6rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Atualizar
              </button>
              <button
                onClick={() => {
                  setEditandoUid(null);
                  setNome("");
                  setEmail("");
                  setIsAdmin(false);
                }}
                style={{
                  marginLeft: "1rem",
                  background: "#fff",
                  border: "1px solid #ccc",
                  padding: "0.6rem 1rem",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}