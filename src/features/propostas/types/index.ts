import type { AgendamentoStatus } from '@/shared/constants'

export interface PacoteOption {
  id: string
  nome: string
  valorBase: number
  ativo: boolean
  bloqueiaDiaInteiro: boolean
  duracaoEstimada?: string
}

export interface UsuarioOption {
  id: string
  nome: string
  papel?: string
  ativo?: boolean
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

export interface NovaPropostaPayload {
  pacoteId: string
  editorId?: string
  fotografoId?: string
  dataHoraEnsaio: string
  duracaoMinutos?: number
  localEnsaio: string
  custoDeslocamento?: number
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
  localEnsaio: string
  taxaDeslocamento: number
  percentualEntrada: number
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
  clausulasHtml: string
  fotografoResponsavel: string | null
  fotografos: Array<{ nome: string; papel: string }>
}

export interface PropostaStatusPublico {
  status: AgendamentoStatus
  podeAssinar: boolean
  dataAssinatura: string | null
  assinanteNome: string | null
}
