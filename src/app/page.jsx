import Image from "next/image";
import "./page.css";
import LinkButton from "./components/LinkButton";
import Footer from "./components/Footer";
// import Link from "next/link"

export default function Home() {
  return (
    <main className="main">
      <div className="logo">
        <Image
          src="/images/logo-cmat-perfil.png"
          className="imageLogo"
          alt="Logo"
          width={130}
          height={130}
          style={{
            borderRadius: "70px",
            border: "2px solid rgba(255, 255, 255, 1)",
            padding: "2px",
          }}
        />
      </div>

      <div className="acronym">CCMAT</div>

      <div className="description">
        Coordenação do Curso de Matemática - UFDPar
      </div>

      <div className="button-container">
        <LinkButton
          href="https://nhnwihp8.forms.app/curso-latex-na-ufdpar"
          target="_blank"
        >
          Curso LaTeX Básico - 2025.1
        </LinkButton>

        <LinkButton
          href="https://sigaa.ufpi.br/sigaa/public/curso/portal.jsf?id=74246&lc=pt_BR"
          target="_blank"
        >
          Página do Curso de Matemática
        </LinkButton>

        <LinkButton href="mailto:ccmat@ufdpar.edu.br">
          Fale com a Coordenação <br />
          ccmat@ufdpar.edu.br
        </LinkButton>

        <LinkButton href="https://www.instagram.com/camatufdpar/?hl=pt-br">
          Centro Acadêmico
        </LinkButton>

        <LinkButton href="/fluxograma/" target="_blank">
          Fluxograma do Curso
        </LinkButton>

        <LinkButton href="https://nemat-ufdpar.vercel.app" target="_blank">
          Núcleo de Estudo em Matemática <br />
          NEMAT UFDPar
        </LinkButton>
      </div>

      <Footer />
    </main>
  );
}
