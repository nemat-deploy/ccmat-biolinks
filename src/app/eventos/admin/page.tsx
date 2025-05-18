"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { auth, onAuthStateChanged } from "@/lib/firebaseAuth";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [eventos, setEventos] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Redireciona se não estiver logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/eventos/login");
      } else {
        setUser(currentUser);
        fetchEventos();
      }
    });

    return () => unsubscribe();
  }, []);

  // Busca todos os eventos
  async function fetchEventos() {
    try {
      const querySnapshot = await getDocs(collection(db, "eventos"));
      const lista = [];

      querySnapshot.forEach((doc) => {
        lista.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setEventos(lista);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
    }
  }

  if (!eventos.length) {
    return <p>Carregando eventos...</p>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "bold" }}>Área Administrativa</h1>
      <p style={{ marginBottom: "2.5rem", borderTop: "1px solid #d3d3d3", borderBottom: "1px solid #d3d3d3" }}>Logado como: {user?.email}</p>

      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {eventos.map((evento) => (
          <li key={evento.id} style={{ marginBottom: "1rem" }}>
            <Link
              href={`/eventos/admin/${evento.id}`}
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#0070f3",
                textDecoration: "none",
              }}
            >
              {evento.name || evento.id}
            </Link>
          </li>
        ))}
      </ul>

      <br />
      <button
        onClick={() => {
          auth.signOut().then(() => router.push("/eventos/login"));
        }}
        style={{
          background: "red",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Sair
      </button>
    </div>
  );
}
