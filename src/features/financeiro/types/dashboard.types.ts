import type { FormaPagamento, StatusReceita, TipoServico } from './receita.types'

export interface CardsResumo {
  valorBruto: number
  despesasTotais: number
  liquidoPrevisto: number
  liquidoRealizado: number
  aReceber: number
  margemLucro: number
  ticketMedio: number
  qtdTrabalhos: number
  variacoes: VariacaoCards | null
  detalhamento: Detalhamento | null
}

export interface Detalhamento {
  recebido: number
  entradaEnsaios: number
  restanteEnsaios: number
  receitasEcommerce: number
  receitasAvulsas: number
  comissao: number
  deslocamento: number
  repasses: number
  despesas: number
}

export interface VariacaoCards {
  valorBruto: number | null
  despesasTotais: number | null
  liquidoPrevisto: number | null
  liquidoRealizado: number | null
}

export interface DadoMensal {
  mes: string
  receitas: number
  despesas: number
}

export interface DadoLucroMensal {
  mes: string
  liquido: number
}

export interface DespesaCategoriaDado {
  categoria: string
  cor: string | null
  valor: number
}

export interface RentabilidadeServico {
  tipoServico: TipoServico | string
  receita: number
  liquido: number
  margem: number
}

export interface RentabilidadeTrabalho {
  agendamentoId: string | null
  clienteNome: string
  tipoServico: TipoServico | string
  valorTrabalho: number
  custoTrabalho: number
  roi: number
  margem: number
}

export interface Lancamento {
  id: string
  tipo: 'RECEITA' | 'DESPESA'
  data: string | null
  descricao: string
  categoria: string
  valor: number
  status: StatusReceita | 'PAGO' | 'PENDENTE' | 'RECORRENTE'
  origem: string
}

export interface FinanceiroDashboardData {
  cards: CardsResumo
  barraMensal: DadoMensal[]
  despesasPorCategoria: DespesaCategoriaDado[]
  lucroMensal: DadoLucroMensal[]
  rentabilidadePorServico: RentabilidadeServico[]
  rentabilidadePorTrabalho: RentabilidadeTrabalho[]
  ultimosLancamentos: Lancamento[]
}

export interface DashboardQueryParams {
  dataInicio?: string
  dataFim?: string
  tipoServico?: TipoServico
  status?: StatusReceita
  clienteId?: string
  formaPagamento?: FormaPagamento
}
