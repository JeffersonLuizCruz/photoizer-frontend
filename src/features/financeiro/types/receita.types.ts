export const STATUS_RECEITA = {
  PAGO_TOTAL: 'PAGO_TOTAL',
  PAGO_PARCIAL: 'PAGO_PARCIAL',
  PENDENTE: 'PENDENTE',
  CANCELADO: 'CANCELADO',
} as const

export const TIPO_SERVICO = {
  ENSAIO: 'ENSAIO',
  CASAMENTO: 'CASAMENTO',
  EVENTO: 'EVENTO',
  PRODUTO: 'PRODUTO',
  OUTRO: 'OUTRO',
} as const

export const FORMA_PAGAMENTO = {
  PIX: 'PIX',
  CARTAO: 'CARTAO',
  DINHEIRO: 'DINHEIRO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  OUTRO: 'OUTRO',
} as const

export type StatusReceita = (typeof STATUS_RECEITA)[keyof typeof STATUS_RECEITA]
export type TipoServico = (typeof TIPO_SERVICO)[keyof typeof TIPO_SERVICO]
export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO]

export interface Receita {
  id: string
  agendamentoId: string | null
  clienteId: string | null
  clienteNome: string
  tipoServico: TipoServico
  descricao: string | null
  valorBruto: number
  valorComissao: number
  valorFinal: number
  status: StatusReceita
  valorRecebido: number
  dataPrevisaoRecebimento: string | null
  dataRecebimentoReal: string | null
  formaPagamento: FormaPagamento | null
  observacoes: string | null
  createdAt: string
}

export interface ReceitaRequest {
  agendamentoId?: string | null
  clienteId?: string | null
  tipoServico: TipoServico
  descricao?: string
  valorBruto: number
  status?: StatusReceita
  valorRecebido?: number
  dataPrevisaoRecebimento?: string | null
  dataRecebimentoReal?: string | null
  formaPagamento?: FormaPagamento | null
  observacoes?: string
}

export interface ReceitaQueryParams {
  dataInicio?: string
  dataFim?: string
  status?: StatusReceita
  clienteId?: string
  tipoServico?: TipoServico
  formaPagamento?: FormaPagamento
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}
