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
import { Usuario } from "@/types";
import "./page.css";
import LoadingMessage from "@/app/components/LoadingMessage";
// ✅ AJUSTE: Importações para usar os ícones
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);

  const [editandoUid, setEditandoUid] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarUsuarios = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const lista: Usuario[] = [];

      snapshot.forEach((doc) =>
        lista.push({
          id: doc.id,
          ...doc.data(),
        } as Usuario),
      );
      
      lista.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.nome.localeCompare(b.nome);
      });

      setUsuarios(lista);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "/eventos/login";
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists() && snap.data().role === "admin") {
        setUsuarioLogado({ id: snap.id, ...snap.data() } as Usuario);
        await carregarUsuarios();
        setLoading(false);
      } else {
        alert("❌ Acesso negado. Esta página é restrita a administradores.");
        window.location.href = "/eventos/admin";
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingMessage text="Carregando usuários..." fullHeight />;
  }

  const handleEditar = (usuario: Usuario) => {
    setEditandoUid(usuario.id);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setIsEditingAdmin(usuario.role === "admin");
  };

  const handleSalvar = async () => {
    if (!editandoUid) return;
    const userRef = doc(db, "users", editandoUid);
    try {
      await updateDoc(userRef, {
        nome,
        email,
        role: isEditingAdmin ? "admin" : "user",
      });
      setUsuarios(
        usuarios.map((u) =>
          u.id === editandoUid
            ? { ...u, nome, email, role: isEditingAdmin ? "admin" : "user" }
            : u,
        ),
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
      u.email.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Usuários</h1>
        <a href="/eventos/admin" className="voltar-admin-link">
          ← Voltar
        </a>
      </div>

      <input
        type="text"
        className="busca-input"
        placeholder="Buscar por nome ou email..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <table className="usuarios-tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.nome}</td>
              <td>{usuario.email}</td>
              <td>{usuario.role === "admin" ? "✅" : "❌"}</td>
              <td className="actions-cell"> {/* Adicione uma classe se precisar de estilização específica */}
                {/* ✅ AJUSTE: Botão de editar com ícone */}
                <button
                  className="botao-editar"
                  onClick={() => handleEditar(usuario)}
                  title="Editar usuário" // Dica para o usuário
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                
                {/* ✅ AJUSTE: Botão de excluir com ícone */}
                <button
                  className="botao-excluir"
                  onClick={() => handleExcluir(usuario.id)}
                  title="Excluir usuário" // Dica para o usuário
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editandoUid && (
        <div className="form-edicao">
          <h2 className="title-editar-usuario">Editar Usuário</h2>
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
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input type="email" value={email} readOnly />
              </label>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isEditingAdmin}
                  onChange={(e) => setIsEditingAdmin(e.target.checked)}
                  disabled={
                    editandoUid === auth.currentUser?.uid &&
                    usuarioLogado?.role === "admin"
                  }
                />
                É administrador?
              </label>
            </div>

            <div className="botoes-edicao">
              <button type="submit" className="btn-salvar">
                Atualizar
              </button>
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => {
                  setEditandoUid(null);
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