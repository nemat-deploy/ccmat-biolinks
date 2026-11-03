import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.overlay} />
      <div className={styles.container}>
        <Link href="/" className={styles.brandLink}>
          <div className={styles.logoWrapper}>
            <Image
              src="/images/logo-cmat-perfil.png"
              className={styles.imageLogo}
              alt="Logo da Coordenação do Curso de Matemática da UFDPar"
              width={110}
              height={110}
              priority
            />
          </div>
          <h1 className={styles.title}>
            Coordenação do Curso de Matemática - UFDPar
          </h1>
        </Link>
      </div>
    </header>
  );
}
