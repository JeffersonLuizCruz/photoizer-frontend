export interface IndicacaoResponse {
  id: string
  indicadorId: string | null
  indicadorNome: string
  indicadorTelefone: string
  origem: 'PACOTE' | 'FOTO_EXTRA' | 'VIDEO_EXTRA'
  percentual: number
  valorReferencia: number
  valorComissao: number
  status: 'PENDENTE' | 'PAGA' | 'CANCELADA'
  dataPagamento: string | null
  clienteNome: string
  pacoteNome: string
  valorTotalFinal: number
  valorExtras: number
  dataHoraEnsaio: string
}

export interface ConsultaComissoesResponse {
  indicadorNome: string
  indicadorTelefone: string
  totalPendente: number
  totalPago: number
  indicacoes: IndicacaoResponse[]
}

export interface IndicadorListagem {
  indicadorId: string | null
  indicadorNome: string
  indicadorTelefone: string
  totalPendente: number
  totalPago: number
  totalCancelado: number
  totalIndicacoes: number
}

export interface IndicadorRequest {
  nome: string
  telefone: string
  observacoes?: string
}

export interface IndicadorResponse {
  id: string
  nome: string
  telefone: string
  observacoes: string | null
  totalPendente: number
  totalPago: number
  totalIndicacoes: number
}