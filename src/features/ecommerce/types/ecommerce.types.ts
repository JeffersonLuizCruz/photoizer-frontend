import type { AuditInfo } from '@/shared/types'

export interface FotoEnsaio {
  id: string
  auditInfo: AuditInfo
  agendamentoId: string
  fileName: string
  originalUrl: string | null
  watermarkedUrl: string
  thumbUrl: string
  ordem: number
  numeroGaleria: number | null
  status: 'INEDITA' | 'PUBLICADA' | 'AGUARDANDO_COMPROVANTE' | 'AGUARDANDO_CONFIRMACAO' | 'PAGA'
  versaoAtual?: 'ORIGINAL' | 'EDITADA'
  temVersaoEditada?: boolean
  emSelecaoEdicao?: boolean
  editadaFileName?: string | null
  editadaEm?: string | null
  selecionadaPacote: boolean
  downloadada: boolean
  compraExtraId: string | null
  destaque: boolean
  tags: string[]
  categoria: string | null
  titulo: string | null
  fotoEdicaoId: string | null
  visivel: boolean
  arquivosRemovidos: boolean
  arquivosRemovidosEm?: string | null
}

export type ModoGaleria = 'DIRETO' | 'COM_EDICAO' | 'SEM_EDICAO'
export type FaseGaleria = 'SELECAO' | 'SELECAO_ENVIADA' | 'EM_EDICAO' | 'COMERCIALIZACAO'
export type StatusSelecao = 'ENVIADA' | 'EM_EDICAO' | 'CONCLUIDA' | 'PUBLICADA' | 'CANCELADA'

export interface SelecaoEnsaioItemResponse {
  fotoId: string
  numeroGaleria: number
  nomeArquivo: string | null
  tipo: 'PACOTE' | 'EXTRA'
  ordem: number
  valorUnitario: number | null
  editada: boolean
  editadaEm: string | null
  foto: FotoEnsaio | null
}

export interface SelecaoEnsaioResponse {
  id: string
  agendamentoId: string
  numero: number
  status: StatusSelecao
  observacaoCliente: string | null
  enviadaEm: string
  iniciadaEm: string | null
  concluidaEm: string | null
  publicadaEm: string | null
  originaisBaixadosEm: string | null
  quantidadePacote: number
  quantidadeExtras: number
  itens: SelecaoEnsaioItemResponse[]
  podeReabrir: boolean
}

export interface SelecaoPendenteResponse {
  agendamentoId: string
  selecaoId: string
  numero: number
  status: StatusSelecao
  clienteNome: string
  pacoteNome: string
  quantidadePacote: number
  quantidadeExtras: number
  enviadaEm: string
  diasAguardando: number
  requerEdicao: boolean
}

export type EtapaGaleria =
  | 'AGUARDANDO_UPLOAD'
  | 'FOTOS_NAO_PUBLICADAS'
  | 'SELECAO_EM_EDICAO'
  | 'SELECAO_AGUARDANDO_APROVACAO'
  | 'AGUARDANDO_SELECAO'
  | 'AGUARDANDO_DOWNLOAD'
  | 'CONCLUIDA'
  | 'ARQUIVADA'

export interface GaleriaPipelineItem {
  agendamentoId: string
  clienteNome: string
  pacoteNome: string | null
  localEnsaio: string | null
  dataHoraEnsaio: string
  prazoEntrega: string | null
  etapa: EtapaGaleria
  etapaLabel: string
  proximaAcao: string
  acaoUrl: string
  linkGaleria: string | null
  totalFotos: number
  fotosPublicadas: number
  fotosSelecionadas: number
  fotosBaixadas: number
  extrasPendentesEdicao: number
  comprasPendentes: number
  valorExtras: number
  selecaoStatus: StatusSelecao | null
  selecaoNumero: number | null
  selecaoEnviadaEm: string | null
  publicadaEm: string | null
  diasNaEtapa: number
  atrasada: boolean
  tokenExpirado: boolean
  tokenExpiracao: string | null
}

export interface GaleriaPipelineResumo {
  total: number
  aguardandoUpload: number
  fotosNaoPublicadas: number
  aguardandoSelecao: number
  selecaoEmEdicao: number
  selecaoAguardandoAprovacao: number
  aguardandoDownload: number
  concluidas: number
  arquivadas: number
  atrasadas: number
  comprasPendentes: number
  extrasPendentesEdicao: number
}

export interface GaleriaStatusResponse {
  etapa: EtapaGaleria
  etapaLabel: string
  mensagem: string
  previsaoEntrega: string | null
  totalFotos: number
  fotosPublicadas: number
  selecaoStatus: StatusSelecao | null
  selecaoEnviadaEm: string | null
  tokenExpiracao: string | null
}

export interface GaleriaEnsaioResponse {
  agendamentoId: string
  modo: ModoGaleria
  fase: FaseGaleria
  selecaoAtualId: string | null
  capaFotoId: string | null
  capaVersao: 'ORIGINAL' | 'EDITADA' | null
  tituloHero: string | null
  requerEdicao: boolean
  podeAlterarModo: boolean
  arquivada: boolean
  arquivadaEm: string | null
  bytesLiberados: number
  publicadaEm: string | null
}

export interface CompraExtraResponse {
  id: string
  agendamentoId: string
  valorTotal: number
  status: string
  urlComprovante: string | null
  dataPagamento: string | null
  quantidadeFotos: number | null
  metodoPagamento: string | null
  linkPagamentoCartao: string | null
  motivoRecusa: string | null
}

export interface AdminEcommerceResumoResponse {
  totalFotos: number
  fotosPublicadas: number
  fotosSelecionadasPacote: number
  pacoteQuantidadeFotos: number
  fotosPagas: number
  fotosAguardando: number
  fotos: FotoEnsaio[]
  comprasExtras: CompraExtraResponse[]
  valorTotalExtras: number
  favoritosPorFoto: Record<string, number>
  fotosFavoritas: number
  linkGaleria: string | null
  tokenGaleria: string | null
}

export interface CarrinhoItemResponse {
  foto: FotoEnsaio
  quantidadeTotal: number
  pacoteQuantidadeFotos: number
  valorUnitario: number
  subtotal: number
}

export interface CarrinhoResponse {
  itens: CarrinhoItemResponse[]
  quantidade: number
  valorUnitario: number
  subtotal: number
}

export interface CalculoItemResponse {
  fotoId: string
  fileName: string
  valorUnitario: number
}

export interface CalculoCarrinhoResponse {
  itens: CalculoItemResponse[]
  quantidade: number
  valorUnitario: number
  subtotal: number
  total: number
}

export type MetodoPagamento = 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO' | 'CARTAO'

export interface ConfiguracaoPagamentoResponse {
  pixChave: string | null
  pixTipoChave: string | null
}

export interface AdminCompraDetalheResponse extends CompraExtraResponse {
  fotos: FotoEnsaio[]
  auditInfo: AuditInfo
}

/** Compra paga com extras que ainda precisam de edição sob demanda. */
export interface CompraExtraPendenteEdicaoResponse {
  compraId: string
  agendamentoId: string
  clienteNome: string | null
  valorTotal: number
  dataPagamento: string | null
  fotos: FotoEnsaio[]
}

export interface AdminComprasRelatorioResponse {
  totalCompras: number
  aguardandoComprovante: number
  aguardandoConfirmacao: number
  pagas: number
  canceladas: number
  totalFaturado: number
  totalAguardando: number
}

// New types for enhanced e-commerce

export interface Sessao {
  id: string
  auditInfo: AuditInfo
  clienteId: string | null
  nomeSessao: string
  dataRealizacao: string | null
  local: string | null
  descricao: string | null
  status: string
}

export interface Avaliacao {
  id: string
  createdAt: string
  clienteId: string
  agendamentoId: string | null
  pacoteId: string | null
  pontuacao: number
  comentario: string | null
  depoimento: boolean
  aprovado: boolean
}

export type OpcaoEntrega = 'DIGITAL' | 'FISICA' | 'AMBAS'

export interface FotoPopularResponse {
  fotoId: string
  fileName: string
  thumbUrl: string
  selecionadaPacote: boolean
  vendidaExtra: boolean
}

export interface EcommerceAnalyticsResponse {
  receitaTotal: number
  receitaExtras: number
  totalFotosSelecionadas: number
  totalFotosVendidasExtras: number
  taxaConversaoExtras: number
  fotosMaisSelecionadas: FotoPopularResponse[]
}

export interface TopCliente {
  nomeCliente: string
  telefoneCliente: string
  quantidadeCompras: number
  totalGasto: number
}

export interface DashboardEcommerceResponse {
  totalCompras: number
  totalFotosExtras: number
  totalFaturado: number
  ticketMedio: number
  topClientes: TopCliente[]
}

export interface DadosEcommerceMensal {
  mes: string
  quantidadeCompras: number
  quantidadeFotos: number
  valorTotal: number
}

export interface DashboardEcommerceMensalResponse {
  historico: DadosEcommerceMensal[]
}

export type OrigemComentario = 'CLIENTE' | 'STAFF'

export interface FotoComentario {
  id: string
  createdAt: string
  fotoId: string
  autorNome: string | null
  mensagem: string
  origem: OrigemComentario
  lida: boolean
}

export interface ComentariosPorFotoResponse {
  foto: FotoEnsaio
  comentarios: FotoComentario[]
  naoLidas: number
}
