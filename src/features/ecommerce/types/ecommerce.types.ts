export interface FotoEnsaio {
  id: string
  agendamentoId: string
  fileName: string
  originalUrl: string
  watermarkedUrl: string
  thumbUrl: string
  ordem: number
  status: 'INEDITA' | 'PUBLICADA' | 'AGUARDANDO_COMPROVANTE' | 'AGUARDANDO_CONFIRMACAO' | 'PAGA'
  selecionadaPacote: boolean
  compraExtraId: string | null
  destaque: boolean
  tags: string[]
  categoria: string | null
  titulo: string | null
  createdAt: string
  fotoEdicaoId: string | null
  visivel: boolean
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
}

export interface AdminEcommerceResumoResponse {
  totalFotos: number
  fotosPublicadas: number
  fotosSelecionadasPacote: number
  fotosPagas: number
  fotosAguardando: number
  fotos: FotoEnsaio[]
  comprasExtras: CompraExtraResponse[]
  valorTotalExtras: number
  linkGaleria: string
  tokenGaleria: string
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

export type MetodoPagamento = 'PIX' | 'TRANSFERENCIA' | 'DINHEIRO'

export interface AdminCompraDetalheResponse extends CompraExtraResponse {
  fotos: FotoEnsaio[]
  createdAt: string
  updatedAt: string
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
  clienteId: string | null
  nomeSessao: string
  dataRealizacao: string | null
  local: string | null
  descricao: string | null
  status: string
  createdAt: string
}

export interface Avaliacao {
  id: string
  clienteId: string
  agendamentoId: string | null
  pacoteId: string | null
  pontuacao: number
  comentario: string | null
  depoimento: boolean
  aprovado: boolean
  createdAt: string
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
