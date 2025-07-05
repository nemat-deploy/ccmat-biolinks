// src/components/LoadingMessage.tsx
import React, { useEffect, useState } from "react";
import "./LoadingMessage.css";

interface LoadingMessageProps {
  text?: string;
  fullHeight?: boolean;
  delay?: number; // Novo: tempo em ms para começar a mostrar
}

export default function LoadingMessage({
  text = "Carregando...",
  fullHeight = false,
  delay = 300, // padrão: só mostra após 300ms
}: LoadingMessageProps) {
  const [mostrar, setMostrar] = useState(delay === 0); // mostra direto se delay = 0

  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setMostrar(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!mostrar) return null;

  return (
    <div className={`loading-message-container ${fullHeight ? "full-height" : ""}`}>
      <div className="spinner"></div>
      <p className="loading-message">{text}</p>
    </div>
  );
}
