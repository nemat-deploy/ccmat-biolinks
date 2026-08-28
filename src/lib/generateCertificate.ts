import slugify from "slugify";
import { Evento } from "@/types";

export interface ParticipanteInfo {
  nome: string;
  cpf: string;
  isMonitor?: boolean;
  isMinistrante?: boolean;
  papel?: "participante" | "monitor" | "ministrante";
}

/**
 * Formata um objeto Date em formato brasileiro DD/MM/AAAA
 */
function formatarDataPtBr(date: Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Substitui as tags dinâmicas no modelo de texto do certificado.
 */
export function processarTextoCertificado(
  templateHtml: string,
  evento: Evento,
  participante: ParticipanteInfo
): string {
  const dataInicioStr = formatarDataPtBr(evento.startDate);
  const dataFimStr = formatarDataPtBr(evento.endDate);

  const temCpfValido = participante.cpf && participante.cpf !== "—" && participante.cpf.trim() !== "";
  const cpfValor = temCpfValido ? participante.cpf : "";

  let textoProcessado = templateHtml;

  // Se o participante não tem CPF, remove suavemente a expressão ", CPF {cpf}" para o texto fluir naturally
  if (!temCpfValido) {
    textoProcessado = textoProcessado.replace(/,\s*CPF\s*\{cpf\}/gi, "");
    textoProcessado = textoProcessado.replace(/CPF\s*\{cpf\},\s*/gi, "");
    textoProcessado = textoProcessado.replace(/CPF\s*\{cpf\}/gi, "");
  }

  const tagsMap: Record<string, string> = {
    "{nome}": participante.nome,
    "{cpf}": cpfValor,
    "{evento}": evento.name,
    "{data_inicio}": dataInicioStr,
    "{data_fim}": dataFimStr,
    "{carga_horaria}": (evento.cargaHoraria ?? 0).toString(),
  };

  Object.entries(tagsMap).forEach(([tag, val]) => {
    // Substitui todas as ocorrências da tag
    textoProcessado = textoProcessado.split(tag).join(val);
  });

  return textoProcessado;
}

/**
 * Converte qualquer URL de imagem em Base64 (DataURL) garantindo renderização sem bloqueio de CORS no html2canvas.
 * Trata também links do Google Drive se o usuário colar o link de visualização.
 */
async function obterImagemBase64(url: string): Promise<string> {
  const cleanUrl = url.trim();

  // Se já for uma string Base64 (data:image/...)
  if (cleanUrl.startsWith("data:")) return cleanUrl;

  // Converte links do Google Drive (/file/d/ID/view) para link direto de imagem
  let finalUrl = cleanUrl;
  const driveMatch = cleanUrl.match(/\/file\/d\/([^\/]+)/);
  if (driveMatch && driveMatch[1]) {
    finalUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  // Tenta buscar via fetch com CORS
  try {
    const response = await fetch(finalUrl, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.warn("Fetch de imagem direto falhou por CORS, tentando carregamento alternativo:", e);
  }

  // Fallback via elemento Image
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 1123;
        canvas.height = img.naturalHeight || img.height || 794;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
          return;
        }
      } catch (err) {
        console.warn("Taint no canvas:", err);
      }
      resolve(finalUrl);
    };
    img.onerror = () => resolve(finalUrl);
    img.src = finalUrl;
  });
}

/**
 * Gera e dispara o download do PDF do certificado no navegador.
 */
export async function gerarPdfCertificado(
  evento: Evento,
  participante: ParticipanteInfo
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const textoPadraoParticipante = `<p style="text-align: justify;">Certificamos que <strong>{nome}</strong>, CPF {cpf}, participou do evento <strong>{evento}</strong>, no período de {data_inicio} a {data_fim}, perfazendo um total de {carga_horaria} horas.</p>`;
  const textoPadraoMonitor = `<p style="text-align: justify;">Certificamos que <strong>{nome}</strong>, CPF {cpf}, atuou como <strong>MONITOR(A)</strong> no evento <strong>{evento}</strong>, no período de {data_inicio} a {data_fim}, perfazendo um total de {carga_horaria} horas.</p>`;
  const textoPadraoMinistrante = `<p style="text-align: justify;">Certificamos que <strong>{nome}</strong>, CPF {cpf}, atuou como <strong>MINISTRANTE</strong> no evento <strong>{evento}</strong>, no período de {data_inicio} a {data_fim}, perfazendo um total de {carga_horaria} horas.</p>`;
  
  let templateBase = "";
  if (participante.papel === "ministrante" || participante.isMinistrante) {
    templateBase = evento.certificateTextMinistrante?.trim() || textoPadraoMinistrante;
  } else if (participante.papel === "monitor" || participante.isMonitor) {
    templateBase = evento.certificateTextMonitor?.trim() || textoPadraoMonitor;
  } else {
    templateBase = evento.certificateText?.trim() || textoPadraoParticipante;
  }

  const htmlFinal = processarTextoCertificado(templateBase, evento, participante);

  // Cria um elemento temporário fora da tela para renderização visual do A4 Horizontal
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "1123px"; // Proporção A4 Horizontal a 96DPI (297mm)
  container.style.height = "794px";  // Proporção A4 Horizontal a 96DPI (210mm)
  container.style.backgroundColor = "#ffffff";
  container.style.boxSizing = "border-box";
  container.style.overflow = "hidden";

  // Configura a imagem de fundo se existir (converte em Base64 para garantir que o html2canvas renderize sem travar no CORS)
  const bgUrlOriginal = evento.certificateBgUrl?.trim();
  if (bgUrlOriginal) {
    const base64Bg = await obterImagemBase64(bgUrlOriginal);

    await new Promise<void>((resolve) => {
      const bgImg = document.createElement("img");
      bgImg.crossOrigin = "anonymous";
      bgImg.src = base64Bg;
      bgImg.style.position = "absolute";
      bgImg.style.left = "0";
      bgImg.style.top = "0";
      bgImg.style.width = "100%";
      bgImg.style.height = "100%";
      bgImg.style.objectFit = "cover";
      bgImg.style.zIndex = "1";

      bgImg.onload = () => resolve();
      bgImg.onerror = (err) => {
        console.warn("Não foi possível carregar a imagem de fundo no container:", err);
        resolve();
      };

      container.appendChild(bgImg);
    });
  } else {
    container.style.border = "12px solid #2c5282";
  }

  // Div interna para alinhamento vertical e horizontal do texto (zIndex 2 sobre a imagem)
  const innerContent = document.createElement("div");
  innerContent.style.position = "relative";
  innerContent.style.zIndex = "2";
  innerContent.style.width = "100%";
  innerContent.style.height = "100%";
  innerContent.style.display = "flex";
  innerContent.style.alignItems = "center";
  innerContent.style.justifyContent = "center";
  innerContent.style.padding = "60px 100px";
  innerContent.style.boxSizing = "border-box";

  // Div do texto formatado
  const textHolder = document.createElement("div");
  textHolder.style.width = "100%";
  textHolder.style.fontSize = "22px";
  textHolder.style.lineHeight = "1.8";
  textHolder.style.color = "#1a202c";
  textHolder.style.fontFamily = "Arial, sans-serif";
  textHolder.innerHTML = htmlFinal;

  innerContent.appendChild(textHolder);
  container.appendChild(innerContent);
  document.body.appendChild(container);

  try {
    // Aguarda um pequeno momento para renderização final de fontes e estilos
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2, // Maior resolução no PDF
      useCORS: true, // Permite carregar imagens externas com CORS
      allowTaint: false, // Evita corromper a exportação toDataURL
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);

    const nomeArquivo = `Certificado_${slugify(evento.name, { lower: true })}-${slugify(participante.nome, { lower: true })}.pdf`;
    pdf.save(nomeArquivo);
  } finally {
    // Remove o container temporário da árvore do DOM
    document.body.removeChild(container);
  }
}
