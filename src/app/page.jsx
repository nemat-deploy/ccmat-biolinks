import "./page.css";
import Header from "./components/Header";
import LinkButton from "./components/LinkButton";
import Footer from "./components/Footer";
// import Link from "next/link"

export const metadata = {
  alternates: { canonical: "/" },
};

const organization = {
  "@type": "EducationalOrganization",
  "@id": "https://matematica-ufdpar.vercel.app/#organization",
  name: "Coordenação do Curso de Matemática - UFDPar (CCMAT)",
  alternateName: [
    "Matemática UFDPar",
    "CCMAT UFDPar",
    "Licenciatura em Matemática UFDPar",
  ],
  url: "https://matematica-ufdpar.vercel.app",
  logo: "https://matematica-ufdpar.vercel.app/images/logo-cmat-perfil.png",
  email: "ccmat@ufdpar.edu.br",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Parnaíba",
    addressRegion: "PI",
    addressCountry: "BR",
  },
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Universidade Federal do Delta do Parnaíba (UFDPar)",
    url: "https://ufdpar.edu.br",
  },
  sameAs: [
    "https://instagram.com/matematica.ufdpar",
    "https://sigaa.ufpi.br/sigaa/public/curso/portal.jsf?id=74246&lc=pt_BR",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://matematica-ufdpar.vercel.app/#website",
      name: "Matemática UFDPar",
      alternateName: ["CCMAT UFDPar", "Matematica UFDPar"],
      url: "https://matematica-ufdpar.vercel.app/",
      inLanguage: "pt-BR",
      publisher: {
        "@id": "https://matematica-ufdpar.vercel.app/#organization",
      },
    },
    organization,
  ],
};

export default function Home() {
  return (
    <main className="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <div className="button-container">
        <LinkButton
          href="https://sigaa.ufpi.br/sigaa/public/curso/portal.jsf?id=74246&lc=pt_BR"
          target="_blank"
        >
          Página do Curso de Matemática
        </LinkButton>

        <LinkButton href="/fluxograma/" target="_blank">
          Fluxograma do Curso
        </LinkButton>

        <LinkButton href="https://nemat-ufdpar.vercel.app" target="_blank">
          Núcleo de Estudos em Matemática <br /> NEMAT/UFDPar
        </LinkButton>

        <LinkButton href="/eventos">
          Eventos <br /> (inscrições e certificados)
        </LinkButton>

        <LinkButton
          href="https://www.im.ufrj.br/index.php/pt/estrutura/editora-im/matematica"
          target="_blank"
        >
          Livros Gratuitos
        </LinkButton>

        <LinkButton href="https://www.instagram.com/camatufdpar/?hl=pt-br">
          Centro Acadêmico
        </LinkButton>

        <LinkButton href="mailto:ccmat@ufdpar.edu.br">
          Fale com a Coordenação <br />
          ccmat@ufdpar.edu.br
        </LinkButton>
      </div>

      <Footer />
    </main>
  );
}
