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
  createdAt: string
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
