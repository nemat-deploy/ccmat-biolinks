// src/app/api/lembretes/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const espera = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// BOA PRÁTICA: O Transporter fica de fora da função POST. 
// Assim, o Next.js inicia a conexão apenas uma vez quando o servidor sobe,
// reaproveitando a mesma sessão do Gmail e deixando tudo muito mais rápido e estável.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'geemat.ufdpar@gmail.com',
    pass: process.env.SENHA_EMAIL
  }
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participantes, nomeEvento, assunto, mensagemHtml } = body;

    // BOA PRÁTICA: Validação estrita logo no começo
    if (!participantes || !Array.isArray(participantes) || participantes.length === 0) {
      return NextResponse.json({ error: 'Lista de participantes inválida ou vazia.' }, { status: 400 });
    }
    if (!assunto || !mensagemHtml) {
      return NextResponse.json({ error: 'Assunto e mensagem são obrigatórios.' }, { status: 400 });
    }

    console.log(`Iniciando o envio para ${nomeEvento} (${participantes.length} inscritos)...`);

    for (const p of participantes) {
      // Pula silenciosamente se o usuário não tiver e-mail
      if (!p.email) continue; 

      const mailOptions = {
        from: `"Congresso GEEMat 2026" <geemat.ufdpar@gmail.com>`,
        to: p.email,
        subject: assunto,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="UTF-8"></head>
          <body style="margin: 0; padding: 0;">
            <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://ik.imagekit.io/rmelojs/geemat-ufdpar/logo_geemat_email_240x80.png" alt="Logo do Evento" style="width: auto; height: auto; margin-bottom: 30px;">
              </div>
              
              <h2 style="margin-bottom: 30px; color: #2c3e50; text-align: center;">${nomeEvento}</h2>
              
              <p>Prezado(a) <strong>${p.nome}</strong>,</p>
              
              ${mensagemHtml.replace(/{nome}/g, p.nome).replace(/{evento}/g, nomeEvento)}
              
              <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;">
              <p style="font-size: 0.9em; color: #7f8c8d; text-align: center;">
                Atenciosamente,<br>
                <strong>Equipe Organizadora - Congresso GEEMat - UFDPar</strong><br>
                <a href="https://geemat-ufdpar.web.app">https://geemat-ufdpar.web.app</a>
              </p>
            </div>
          </body>
          </html>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Enviado para: ${p.email}`);
      } catch (err) {
        console.error(`❌ Erro ao enviar para ${p.email}:`, err);
      }

      // Delay para respeitar o limite do Gmail
      await espera(2000); 
    }

    return NextResponse.json({ message: 'Processamento concluído!' });
  } catch (error) {
    console.error('Erro geral na API:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}