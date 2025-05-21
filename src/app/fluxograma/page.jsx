"use client";

import React from "react";
import styles from "./Page.module.css";

function Fluxograma() {
  const handleImageOpen = () => {
    window.open("/docs/pre-requisitos-2021.pdf");
  };
  const handleResumidoPdf = () => {
    window.open("/docs/fluxograma-resumido.pdf");
  };
  const handleCompletoPdf = () => {
    window.open("/docs/fluxograma-matematica-ufdpar.pdf");
  };

  return (
    <div className={styles.mainFluxograma}>
      <div className={styles.options}>
        <h3>Fluxograma do Curso de Matemática - UFDPar</h3>

        <button className={styles.btImage} onClick={handleImageOpen}>
          Pré-requisitos
        </button>

        <button className={styles.btImage} onClick={handleResumidoPdf}>
          Fluxograma Resumido
        </button>

        <button className={styles.btImage} onClick={handleCompletoPdf}>
          Fluxograma Completo
        </button>
      </div>
    </div>
  );
}

export default Fluxograma;
