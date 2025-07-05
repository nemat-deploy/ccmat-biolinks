// src/app/eventos/admin/evento/[eventoId]/presenca/components/Modal.tsx
"use client";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
};

export default function Modal({ isOpen, onClose, title = "Erro", message }: ModalProps) {
  console.log("Modal renderizado", { isOpen, message });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <button className="modal-button" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}