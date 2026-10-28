import type { AgendamentoStatus } from '@/shared/constants'

export interface PacoteOption {
  id: string
  nome: string
  valorBase: number
  ativo: boolean
  bloqueiaDiaInteiro: boolean
  duracaoEstimada?: string
}

export interface OpcoesFotografo {
  fotografos: Array<{ id: string; nome: string }>
  fotografoPadraoId: string | null
}

export interface IndicadorOption {
  id: string
  nome: string
  telefone: string
  percentualComissao: number | null
}

export interface DisponibilidadeResponse {
  disponivel: boolean
  conflitos: Array<{
    agendamentoId: string
    horario: string
    clienteNome: string
  }>
  bloqueios: Array<{
    bloqueioId: string
    titulo: string
    inicio: string
    fim: string
  }>
}

export interface Proposta {
  id: string
  clienteId: string | null
  clienteNome: string | null
  clienteTelefone: string | null
  pacoteNome: string
  fotografoNome: string | null
  dataHoraEnsaio: string
  localEnsaio: string
  status: AgendamentoStatus
  tokenProposta: string | null
  valorTotal: number
  valorEntradaExigido: number
  valorEntradaPago: number
  valorRestante: number
  autorizaUsoImagem: boolean
  dataEnvioProposta: string | null
  dataAssinatura: string | null
  temComprovanteEntrada?: boolean
  temTermoAssinado?: boolean
  motivoRecusa?: string | null
  dataRecusa?: string | null
  recusadoPor?: string | null
}

export interface PropostaDetalhe {
  id: string
  status: AgendamentoStatus
  pacoteId: string
  editorId: string | null
  fotografoId: string | null
  dataHoraEnsaio: string
  duracaoMinutos: number
  localEnsaio: string
  custoDeslocamento: number | null
  valorEntradaPago: number | null
  repassarDeslocamento: boolean | null
  clausulasPersonalizadas: string | null
  observacoes: string | null
  indicadorNome: string | null
  tokenProposta: string | null
  fotografos: Array<{
    fotografoId: string
    valorRepassar: number | null
    tipoValor: 'FIXO' | 'PERCENTUAL' | null
    percentual: number | null
  }>
}

export interface NovaPropostaPayload {
  pacoteId: string
  editorId?: string
  fotografoId?: string
  dataHoraEnsaio: string
  duracaoMinutos?: number
  localEnsaio: string
  custoDeslocamento?: number
  valorEntradaPago?: number
  repassarDeslocamento?: boolean
  clausulasPersonalizadas?: string
  observacoes?: string
  indicadorId?: string
  indicadorNome?: string
  indicadorTelefone?: string
  fotografos?: Array<{
    fotografoId: string
    tipoValor: 'FIXO' | 'PERCENTUAL'
    valorRepassar?: number
    percentual?: number
  }>
}

export interface PropostaPublica {
  status: AgendamentoStatus
  podeAssinar: boolean
  contratadaNome: string
  contratadaCnpj: string
  contratadaCidade: string
  pixChave: string
  pixTipoChave: string
  pacoteNome: string
  valorPacote: number
  precoFotoExtra: number
  dataHoraEnsaio: string
  duracaoMinutos: number
  duracaoLabel: string
  localEnsaio: string
  taxaDeslocamento: number
  percentualEntrada: number
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
  clausulasHtml: string
  fotografoResponsavel: string | null
  fotografos: Array<{ nome: string; papel: string }>
  exigeComprovante: boolean
  valorEntradaPago: number
}

export interface PropostaStatusPublico {
  status: AgendamentoStatus
  podeAssinar: boolean
  dataAssinatura: string | null
  assinanteNome: string | null
}
