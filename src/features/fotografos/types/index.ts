export interface Fotografo {
  id: string
  nome: string
  email: string
  telefone?: string
  papel: string
  ativo: boolean
}

export interface FotografoEnsaiosResponse {
  agendamentoId: string
  clienteNome: string
  pacoteNome: string | null
  dataHoraEnsaio: string
  status: string
  valorTotal: number
  custosFotografo: number
  partilhaFotografo: number
  repassarFotografo: number
  lucroCrm: number
}

export interface FotografoDashboardResponse {
  fotografoId: string
  fotografoNome: string
  totalEnsaios: number
  totalValorCobrado: number
  totalCustosFotografo: number
  totalPartilha: number
  totalRepasse: number
  totalLucroCrm: number
  ultimosEnsaios: FotografoEnsaiosResponse[]
}

export interface FotografoResumoFinanceiroResponse {
  fotografoId: string
  fotografoNome: string
  totalEnsaios: number
  ensaiosPendentes: number
  ensaiosRealizados: number
  ensaiosFinalizados: number
  totalValorCobrado: number
  totalCustosFotografo: number
  totalPartilha: number
  totalRepasse: number
  totalLucroCrm: number
  mediaPartilhaPorEnsaio: number
  totalRepassesPendentes: number
  totalRepassesRealizados: number
  custosPorCategoria: Record<string, number>
  custosPorEnsaio: CustoPorEnsaio[]
}

export interface CustoPorEnsaio {
  agendamentoId: string
  clienteNome: string
  dataEnsaio: string
  total: number
}

export interface FotografoRelatorioGlobalResponse {
  totalFotografos: number
  totalEnsaios: number
  totalValorCobrado: number
  totalCustos: number
  totalPartilha: number
  totalRepasse: number
  totalLucroCrm: number
  porFotografo: FotografoRelatorioItem[]
}

export interface FotografoRelatorioItem {
  fotografoNome: string
  totalEnsaios: number
  totalValorCobrado: number
  totalCustos: number
  totalPartilha: number
  totalRepasse: number
  totalLucroCrm: number
}

export interface AgendamentoFotografo {
  id: string
  agendamento: {
    id: string
    cliente: { id: string; nome: string }
    pacote?: { id: string; nome: string } | null
    dataHoraEnsaio: string
    status: string
  } | null
  fotografo: Fotografo
  valorRepassar: number
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO'
  tipoValor: 'FIXO' | 'PERCENTUAL'
  percentual: number | null
  dataPagamento: string | null
  createdAt: string
  updatedAt: string
}