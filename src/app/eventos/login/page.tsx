// src/app/eventos/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, provider, signInWithPopup, signOut } from "@/lib/firebaseAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth"; // ✅ Importe aqui

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Verifica login automático
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const userData = snap.data();
          if (userData.isAdmin === true) {
            router.push("/eventos/admin");
          } else {
            alert("❌ Acesso negado. Somente administradores.");
            await auth.signOut();
          }
        } else {
          // Cria usuário automaticamente
          await setDoc(userRef, {
            nome: currentUser.displayName || "",
            email: currentUser.email,
            isAdmin: false,
          });

          alert("⚠️ Sua conta foi criada, mas você ainda não tem acesso à área administrativa.");
          await auth.signOut();
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        alert("❌ Erro ao verificar permissões.");
        await auth.signOut();
      }
    });

    return () => unsubscribe();
  }, []);

  // Função de login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        if (snap.data().isAdmin === true) {
          router.push("/eventos/admin");
        } else {
          alert("❌ Acesso negado. Somente administradores.");
          await auth.signOut();
        }
      } else {
        alert("⚠️ Sua conta foi criada, mas você ainda não tem permissão de administrador.");
        await auth.signOut();
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert("❌ Erro ao entrar com Google.");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Login Administrativo</h1>
      <p>Seu cadastro de usuário será criado após fazer o login com sua conta Google.</p>

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