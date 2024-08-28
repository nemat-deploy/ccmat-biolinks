import Image from "next/image";
import "./page.css";
import LinkButton from "./components/LinkButton";
import Footer from "./components/Footer"

export default function Home() {
  return (
    <main className="main">

      <div className="logo">
        <Image src="/images/logo-laef-ufdpar.svg" 
        alt="Logo" 
        width={130} 
        height={130} />
      </div>

      <div className="description">
        Liga Acadêmica de Educaçao Financeira
      </div>

      <LinkButton href="https://sites.google.com/view/laefufdpar/in%C3%ADcio">
        Site institucional
      </LinkButton>

      <LinkButton href="https://forms.gle/xhscLPgXjvoLwkhv7" target="_blank">
        Formulário de Inscrição <br/> 2024
      </LinkButton>

      <LinkButton href="https://docs.google.com/document/d/1R0x3nBFmszOBFnVB7z3bokxXoWJ1dCPINlm9BUhPO_4/edit?usp=sharing">
        Edital 2024 <br/> Novos Membros
      </LinkButton>
      
      <Footer />

    </main>
  );
}
