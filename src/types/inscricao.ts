// src/types/inscricao.ts
export type Inscricao = {
  nome: string
  email: string
  telefone: string
  institution: string
  dataInscricao: Date
  attendances: string[] 
  certificateIssued: boolean
}