"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, signInWithPopup, onAuthStateChanged } from "@/lib/firebaseAuth";

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Verifica se já está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/eventos/admin");
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Função de login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("❌ Erro ao entrar com Google.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Login Administrativo</h1>

      <p>Acesse com sua conta Google para entrar na área de administração.</p>

      <button
        onClick={handleLogin}
        style={{
          background: "#4285F4",
          color: "white",
          border: "none",
          padding: "0.8rem 1.2rem",
          fontSize: "1rem",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Entrar com Google
      </button>

      <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
        Apenas usuários adicionados como test users podem acessar.
      </p>
    </div>
  );
}