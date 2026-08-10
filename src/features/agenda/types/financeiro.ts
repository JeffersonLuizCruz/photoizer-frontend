export interface FinanceiroTrabalho {
  agendamentoId: string
  clienteNome: string
  pacoteNome: string | null
  valorCobrado: number
  valorEntradaPago: number
  saldoDevedor: number
  totalRecebido: number
  statusPagamento: 'PAGO' | 'PARCIAL' | 'PENDENTE'
  totalDespesas: number
  custoDeslocamento: number
  comissao: number
  custoTotal: number
  lucroBruto: number
  margemLucro: number
  receitas: FinanceiroTrabalhoReceita[]
  despesas: FinanceiroTrabalhoDespesa[]
  pagamentos: FinanceiroTrabalhoPagamento[]
}

export interface FinanceiroTrabalhoReceita {
  id: string
  agendamentoId: string | null
  clienteId: string
  clienteNome: string
  tipoServico: string
  descricao: string | null
  valorBruto: number
  valorComissao: number
  valorFinal: number
  status: 'PAGO_TOTAL' | 'PAGO_PARCIAL' | 'PENDENTE' | 'CANCELADO'
  valorRecebido: number
  dataPrevisaoRecebimento: string | null
  dataRecebimentoReal: string | null
  formaPagamento: string | null
  observacoes: string | null
  createdAt: string
}

export interface FinanceiroTrabalhoDespesa {
  id: string
  descricao: string
  valor: number
  categoriaId: string | null
  categoria: string
  cor: string | null
  data: string
  status: 'PAGO' | 'PENDENTE' | 'RECORRENTE'
  recorrencia: 'UNICA' | 'MENSAL' | 'ANUAL'
  agendamentoId: string | null
  dataPagamento: string | null
  urlComprovante: string | null
  observacao: string | null
}

export interface FinanceiroTrabalhoPagamento {
  id: string
  agendamentoId: string
  valor: number
  dataPagamento: string
  urlComprovante: string | null
  observacao: string | null
}
