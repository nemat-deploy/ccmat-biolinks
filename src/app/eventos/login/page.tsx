"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, signInWithPopup } from "@/lib/firebaseAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
  const router = useRouter();

  // Função centralizada para lidar com a autenticação do usuário
  const handleUserAuth = async (currentUser: User) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          nome: currentUser.displayName || "",
          email: currentUser.email,
          role: 'user',
        });
        alert("✅ Sua conta foi criada com sucesso!");
      }

      router.push("/eventos/admin");

    } catch (err) {
      console.error("Erro no processo de autenticação:", err);
      alert("❌ Ocorreu um erro durante o login. Tente novamente.");
      await auth.signOut();
    }
  };

  // Efeito para verificar se o usuário já está logado
  useEffect(() => {
    let isHandlingAuth = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !isHandlingAuth) {
        isHandlingAuth = true;
        handleUserAuth(user);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Função para o clique no botão de login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Erro ao fazer login com Google:", err);
      
      // ✅ AJUSTE: Verificamos se 'err' é uma instância de FirebaseError
      if (err instanceof FirebaseError) {
        // Agora o TypeScript sabe que 'err' tem a propriedade 'code'
        if (err.code !== 'auth/popup-closed-by-user') {
          alert("❌ Erro ao entrar com Google.");
        }
      } else {
        // Caso seja um erro de outro tipo
        alert("❌ Ocorreu um erro inesperado ao tentar fazer login.");
      }
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login Administrativo</h1>
      <p>Acesse com sua conta Google para gerenciar seus eventos.</p>

      <button
        onClick={handleLogin}
        style={{
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          padding: "0.8rem 1.2rem",
          fontSize: "1rem",
          fontWeight: "bold",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
          outline: "none",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "300px",
          margin: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#357ae8")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#4285F4")}
      >
        Entrar com Google
      </button>
    </div>
  );
}