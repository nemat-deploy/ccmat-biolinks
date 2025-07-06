// src/app/components/ConfirmationModal.tsx
"use client";

import { useEffect } from "react";
import styles from "./ConfirmationModal.module.css";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.messageContent}>{message}</div>
        </div>

        <footer className={styles.footer}>
          <button 
            type="button"
            onClick={onClose} 
            className={`${styles.button} ${styles.buttonCancel}`}
          >
            {cancelText}
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className={`${styles.button} ${styles.buttonConfirm}`}
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
}