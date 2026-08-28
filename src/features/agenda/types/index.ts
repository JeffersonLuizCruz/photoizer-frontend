import type { AgendamentoStatus } from '@/shared/constants'

export type TipoRepasse = 'FIXO' | 'PERCENTUAL'
export type RepasseStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO'
export type PapelParceiro = 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'

export interface FotografoNoAgendamento {
  fotografoId: string
  fotografoNome: string
  valorRepassar: number
  status: RepasseStatus
  dataPagamento: string | null
  tipoValor: TipoRepasse
  percentual: number | null
  papelParceiro: PapelParceiro | null
}

export interface Pacote {
  id: string
  nome: string
  descricao?: string
  quantidadeFotos: number
  quantidadeVideos: number
  valorBase: number
  bloqueiaDiaInteiro: boolean
  duracaoEstimada?: string
  ativo: boolean
}

export interface Agendamento {
  id: string
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteEmail: string | null
  clienteCpf: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  pacoteId: string
  pacoteNome: string
  editorId: string | null
  editorNome: string | null
  fotografoId: string | null
  fotografoNome: string | null
  fotografos: FotografoNoAgendamento[] | null
  valorPartilhaGlobal: number | null
  valorLucroCrm: number | null

  dataHoraEnsaio: string
  duracaoMinutos: number
  localEnsaio: string
  enderecoCompleto: string | null

  valorTotal: number
  valorEntradaExigido: number
  valorEntradaPago: number
  valorRestante: number
  valorExtras: number
  taxaDeslocamento: number
  custoDeslocamento: number
  repassarDeslocamento: boolean
  valorTotalFinal: number
  percentualEntrada: number
  valorPacote: number
  saldoDevedor: number

  status: AgendamentoStatus
  dataConfirmacao: string | null
  dataRealizacao: string | null
  dataEnvioSelecao: string | null
  dataEntregaFinal: string | null
  dataFinalizacao: string | null

  urlComprovanteEntrada: string | null
  urlComprovanteFinal: string | null

  autorizaUsoImagem: boolean
  clausulasPersonalizadas: string | null
  contratoGerado: boolean

  ensaioDestaque: boolean

  valorComissao?: number | null
  indicadorNome?: string | null
  statusComissao?: string | null

  observacoes: string | null

  createdAt: string
  updatedAt: string
}

export interface Pagamento {
  id: string
  agendamentoId: string
  valor: number
  dataPagamento: string
  urlComprovante: string | null
  observacao: string | null
  compraExtraId: string | null
}

export interface ExtraServicoResponse {
  id: string
  agendamentoId: string
  tipo: 'FOTO' | 'VIDEO'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  createdAt: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: string
}

export type {
  FinanceiroTrabalho,
  FinanceiroTrabalhoDespesa,
  FinanceiroTrabalhoPagamento,
} from './financeiro'
