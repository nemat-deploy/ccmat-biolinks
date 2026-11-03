"use client";

import React from "react";
import Link from "next/link";
import "../page.css";
import styles from "./Page.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

function Fluxograma() {
  return (
    <main className="main">
      <Header />

      <div className={styles.contentWrapper}>
        <h2 className={styles.sectionTitle}>Fluxograma do Curso</h2>

        <div className={styles.card}>
          <div className={styles.docList}>
            <a
              href="/docs/pre-requisitos-2021.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docButton}
            >
              <span>📄 Pré-requisitos</span>
              <span className={styles.badge}>PDF</span>
            </a>

            <a
              href="/docs/fluxograma-resumido.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docButton}
            >
              <span>📊 Fluxograma Resumido</span>
              <span className={styles.badge}>PDF</span>
            </a>

            <a
              href="/docs/fluxograma-matematica-ufdpar.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docButton}
            >
              <span>📑 Fluxograma Completo</span>
              <span className={styles.badge}>PDF</span>
            </a>
          </div>
        </div>

        <div className={styles.backWrapper}>
          <Link href="/" className={styles.backButton}>
            ← voltar
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default Fluxograma;
