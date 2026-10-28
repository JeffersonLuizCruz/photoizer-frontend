import type { AgendamentoStatus, FormaPagamento } from '@/shared/constants'

export type TipoRepasse = 'FIXO' | 'PERCENTUAL'
export type OrigemAgendamento = 'PROPOSTA' | 'AVULSO' | 'IMPORTADO'
export type RepasseStatus = 'PENDENTE' | 'PAGO' | 'CANCELADO'
export type PapelParceiro = 'ADMIN' | 'FOTOGRAFO' | 'EDITOR' | 'AGENDADOR'

export interface FotografoNoAgendamento {
  fotografoId: string
  fotografoNome: string
  // Repasse é métrica interna: vem null para papéis sem visibilidade financeira (AGENDADOR).
  valorRepassar: number | null
  status: RepasseStatus
  dataPagamento: string | null
  tipoValor: TipoRepasse | null
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
  cor?: string | null
  bloqueiaDiaInteiro: boolean
  duracaoEstimada?: string
  ativo: boolean
}

export interface Agendamento {
  id: string
  clienteId: string | null
  clienteNome: string | null
  clienteTelefone: string | null
  clienteEmail: string | null
  clienteCpf: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  pacoteId: string
  pacoteNome: string
  pacoteCor: string | null
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

  valorTotal: number
  valorEntradaExigido: number
  valorEntradaPago: number
  valorRestante: number
  valorExtras: number
  taxaDeslocamento: number
  // Custo interno: vem null para papéis sem visibilidade financeira (AGENDADOR).
  custoDeslocamento: number | null
  repassarDeslocamento: boolean
  valorTotalFinal: number
  percentualEntrada: number
  valorPacote: number
  saldoDevedor: number

  status: AgendamentoStatus
  origem?: OrigemAgendamento
  dataConfirmacao: string | null
  dataRealizacao: string | null
  dataPagamentoFinal: string | null
  dataFinalizacao: string | null

  temComprovanteEntrada: boolean
  temComprovanteFinal: boolean
  formaPagamentoFinal: FormaPagamento | null

  autorizaUsoImagem: boolean
  clausulasPersonalizadas: string | null
  tokenProposta: string | null
  dataEnvioProposta: string | null
  dataAssinatura: string | null
  temTermoAssinado: boolean

  motivoRecusa: string | null
  dataRecusa: string | null
  recusadoPor: string | null

  ensaioDestaque: boolean

  valorComissao?: number | null
  indicadorNome?: string | null
  statusComissao?: string | null

  observacoes: string | null

  createdAt: string
  updatedAt: string
}

export interface BloqueioAgenda {
  id: string
  titulo: string
  descricao: string | null
  inicio: string
  fim: string
  profissionalId: string | null
  criadoPorId: string
  criadoEm: string
  ativo: boolean
  profissionalNome?: string | null
}

export interface BloqueioAgendaPayload {
  titulo: string
  descricao?: string | null
  inicio: string
  fim: string
  profissionalId?: string | null
}

export interface Pagamento {
  id: string
  agendamentoId: string
  valor: number
  dataPagamento: string
  urlComprovante: string | null
  observacao: string | null
  compraExtraId: string | null
  formaPagamento?: FormaPagamento | null
  tipoPagamento?: 'ENTRADA' | 'FINAL' | 'EXTRA' | null
}

export interface OpcoesAgendamentoAvulso {
  fotografos: Array<{ id: string; nome: string }>
  fotografoPadraoId: string | null
  percentualEntrada: number
  taxaDeslocamentoPadrao: number
}

export interface CriarAgendamentoAvulsoPayload {
  pacoteId: string
  fotografoId: string
  dataHoraEnsaio: string
  duracaoMinutos: number
  localEnsaio: string
  percentualEntrada?: number
  valorJaRecebido?: number
  dataRecebimento?: string
  formaPagamento?: FormaPagamento
  custoDeslocamento?: number
  repassarDeslocamento?: boolean
  observacoes?: string
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
  ativo?: boolean
}

export interface Reatribuicao {
  id: string
  fotografoAnteriorId: string | null
  fotografoAnteriorNome: string | null
  novoFotografoId: string
  novoFotografoNome: string
  solicitanteNome: string | null
  motivo: string | null
  createdAt: string
}

export type {
  FinanceiroTrabalho,
  FinanceiroTrabalhoDespesa,
  FinanceiroTrabalhoPagamento,
} from './financeiro'
