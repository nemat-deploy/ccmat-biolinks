import Image from "next/image";
import "./page.css";
import LinkButton from "./components/LinkButton";
import Footer from "./components/Footer"
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
            borderRadius: '70px',
            border: '2px solid rgba(255, 255, 255, 1)',
            padding: '2px'
          }}
        />

      </div>

      <div className="acronym">
        CCMAT
      </div>

      <div className="description">
        Coordenação do Curso de Matemática - UFDPar
      </div>

      <div className="button-container">

        <LinkButton 
          href="https://ufdpar.edu.br/ufdpar/edital-no-39-2024-preg-ufdpar-selecao-de-monitores-que-integrarao-o-programa-de-monitoria-da-ufdpar-no-periodo-letivo-2025.1"
          target="_blankk">
          Edital Monitores 2025.1
        </LinkButton>

        <LinkButton 
          href="https://sigaa.ufpi.br/sigaa/public/curso/portal.jsf?id=74246&lc=pt_BR" 
          target="_blank">
          Página do Curso de Matemática
        </LinkButton>
        
        <LinkButton 
          href="mailto:ccmat@ufdpar.edu.br">
          Email da Coordenação <br />
          ccmat@ufdpar.edu.br
        </LinkButton>

        <LinkButton 
          href="/fluxograma/" 
          target="_blank"> 
          Fluxograma do Curso
        </LinkButton>
        
        <LinkButton 
          href="https://nemat-ufdpar.vercel.app" 
          target="_blank"> 
          NEMAT UFDPar
        </LinkButton>

      </div>
      
      <Footer />

    </main>
  );
}
