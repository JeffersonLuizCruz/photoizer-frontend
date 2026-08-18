export const STATUS_DESPESA = {
  PAGO: 'PAGO',
  PENDENTE: 'PENDENTE',
  RECORRENTE: 'RECORRENTE',
} as const

export const RECORRENCIA_DESPESA = {
  UNICA: 'UNICA',
  MENSAL: 'MENSAL',
  ANUAL: 'ANUAL',
} as const

export const FORMA_PAGAMENTO = {
  PIX: 'PIX',
  CARTAO: 'CARTAO',
  DINHEIRO: 'DINHEIRO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  OUTRO: 'OUTRO',
} as const

export type StatusDespesa = (typeof STATUS_DESPESA)[keyof typeof STATUS_DESPESA]
export type RecorrenciaDespesa = (typeof RECORRENCIA_DESPESA)[keyof typeof RECORRENCIA_DESPESA]
export type FormaPagamento = (typeof FORMA_PAGAMENTO)[keyof typeof FORMA_PAGAMENTO]

export interface DespesaCategoria {
  id: string
  nome: string
  cor: string | null
  ativo: boolean
  ordem: number | null
  qtdDespesas: number
}

export interface DespesaRequest {
  descricao: string
  valor: number
  categoriaId: string
  data: string
  formaPagamento?: FormaPagamento
  status: StatusDespesa
  recorrencia: RecorrenciaDespesa
  agendamentoId?: string
  fotografoId?: string
  observacao?: string
}

export interface DespesaResponse {
  id: string
  descricao: string
  valor: number
  categoriaId: string | null
  categoria: string
  cor: string | null
  data: string
  formaPagamento: FormaPagamento | null
  status: StatusDespesa
  recorrencia: RecorrenciaDespesa
  dataProximaGeracao: string | null
  geradaDeId: string | null
  agendamentoId: string | null
  fotografoId: string | null
  dataPagamento: string | null
  urlComprovante: string | null
  observacao: string | null
}

export interface DespesaQueryParams {
  dataInicio?: string
  dataFim?: string
  categoriaId?: string
  status?: StatusDespesa
  agendamentoId?: string
  fotografoId?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface DespesaCategoriaRequest {
  nome: string
  cor?: string
  ativo?: boolean
  ordem?: number
}
