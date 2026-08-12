import type { ContratoStatus } from '@/shared/constants'

export interface Contrato {
  id: string
  status: ContratoStatus
  token: string | null
  clienteId: string | null
  clienteNome: string | null
  clienteTelefone: string | null
  clienteEmail: string | null
  clienteCpf: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  autorizaUsoImagem: boolean | null
  urlComprovanteEntrada: string | null
  pacoteId: string
  pacoteNome: string
  valorPacote: number
  editorId: string | null
  dataHoraEnsaio: string
  duracaoMinutos: number
  localEnsaio: string
  enderecoCompleto: string | null
  taxaDeslocamento: number
  percentualEntrada: number
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
  publicadoEm: string | null
  tokenExpiracao: string | null
  dataAssinatura: string | null
  dataPagamentoConfirmado: string | null
  dataAprovacao: string | null
  dataDevolucao: string | null
  tipoMotivoDevolucao: string | null
  motivoDevolucao: string | null
  agendamentoId: string | null
  urlPdf: string | null
  observacoes: string | null
  snapshotHash: string | null
  indicadorId: string | null
  indicadorNome: string | null
  indicadorTelefone: string | null
}

export interface CriarContratoPayload {
  clienteId?: string
  pacoteId: string
  dataHoraEnsaio: string
  duracaoMinutos?: number
  localEnsaio: string
  enderecoCompleto?: string
  editorId?: string
  custoDeslocamento?: number
  repassarDeslocamento?: boolean
  observacoes?: string
  indicadorId?: string
  indicadorNome?: string
  indicadorTelefone?: string
}

export interface PublicarContratoResponse {
  contratoId: string
  url: string
}

export interface ContratoPublico {
  status: ContratoStatus
  podeAssinar: boolean
  motivoDevolucao: string | null
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
  enderecoCompleto: string | null
  taxaDeslocamento: number
  percentualEntrada: number
  valorTotal: number
  valorEntradaExigido: number
  valorRestante: number
}

export interface ContratoStatusPublico {
  status: ContratoStatus
  podeAssinar: boolean
  motivoDevolucao: string | null
  dataAssinatura: string | null
  assinanteNome: string | null
}

export interface PacoteOption {
  id: string
  nome: string
  valorBase: number
  bloqueiaDiaInteiro: boolean
  duracaoEstimada?: string
}

export interface UsuarioOption {
  id: string
  nome: string
  papel?: string
}

export interface IndicadorOption {
  id: string
  nome: string
  telefone: string
  percentualComissao: number | null
}