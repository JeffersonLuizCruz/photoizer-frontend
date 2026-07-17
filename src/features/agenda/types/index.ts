import type { AgendamentoStatus, TarefaStatus, TarefaTipo } from '@/shared/constants'

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
  valorTotalFinal: number

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
}

export interface FotoExtra {
  id: string
  agendamentoId: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  dataRegistro: string
}

export interface Tarefa {
  id: string
  agendamentoId: string
  tipo: TarefaTipo
  responsavelId: string | null
  dataLimite: string | null
  dataConclusao: string | null
  status: TarefaStatus
}

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: string
}
