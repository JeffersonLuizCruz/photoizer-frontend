import { apiClient } from '@/shared/api'
import { env } from '@/shared/config/env'
import type { FotoEnsaio, CompraExtraResponse, AdminEcommerceResumoResponse, CarrinhoResponse, CalculoCarrinhoResponse, MetodoPagamento, AdminCompraDetalheResponse, AdminComprasRelatorioResponse } from '../types/ecommerce.types'

export interface GaleriaResponse {
  fotos: FotoEnsaio[]
  pacoteQuantidadeFotos: number
  valorUnitarioFotoExtra: number
}

const SESSION_STORAGE_KEY = 'photoizer_cart_session'

function getBaseUrl() {
  return env.VITE_API_URL
}

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

function sessionHeader(): Record<string, string> {
  return { 'X-Session-Id': getSessionId() }
}

export const ecommerceService = {
  getSessionId,

  galeria: async (token: string): Promise<GaleriaResponse> => {
    const { data } = await apiClient.get<GaleriaResponse>(`/ecommerce/galeria/${token}`)
    return data
  },

  selecionar: async (token: string, fotoIds: string[], selecionada: boolean): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.patch<FotoEnsaio[]>(`/ecommerce/galeria/${token}/selecionar`, {
      fotoIds,
      selecionada,
    })
    return data
  },

  adicionarAoCarrinho: async (token: string): Promise<void> => {
    await apiClient.post(`/ecommerce/galeria/${token}/carrinho`, null, { headers: sessionHeader() })
  },

  adicionarAoCarrinhoFoto: async (token: string, fotoId: string): Promise<void> => {
    await apiClient.post(`/ecommerce/galeria/${token}/carrinho`, { fotoId }, { headers: sessionHeader() })
  },

  removerDoCarrinho: async (token: string, fotoId: string): Promise<void> => {
    await apiClient.delete(`/ecommerce/galeria/${token}/carrinho/${fotoId}`, { headers: sessionHeader() })
  },

  listarCarrinho: async (token: string): Promise<CarrinhoResponse> => {
    const { data } = await apiClient.get<CarrinhoResponse>(`/ecommerce/galeria/${token}/carrinho`, { headers: sessionHeader() })
    return data
  },

  contarCarrinho: async (token: string): Promise<number> => {
    const { data } = await apiClient.get<number>(`/ecommerce/galeria/${token}/carrinho/quantidade`, { headers: sessionHeader() })
    return data
  },

  calcular: async (token: string): Promise<CalculoCarrinhoResponse> => {
    const { data } = await apiClient.get<CalculoCarrinhoResponse>(`/ecommerce/galeria/${token}/calcular`, { headers: sessionHeader() })
    return data
  },

  checkout: async (token: string, metodoPagamento?: MetodoPagamento): Promise<CompraExtraResponse> => {
    const { data } = await apiClient.post<CompraExtraResponse>(`/ecommerce/galeria/${token}/checkout`,
      metodoPagamento ? { metodoPagamento } : null,
      { headers: sessionHeader() })
    return data
  },

  listarCompras: async (token: string): Promise<CompraExtraResponse[]> => {
    const { data } = await apiClient.get<CompraExtraResponse[]>(`/ecommerce/galeria/${token}/compras`)
    return data
  },

  detalheCompra: async (token: string, compraId: string): Promise<AdminCompraDetalheResponse> => {
    const { data } = await apiClient.get<AdminCompraDetalheResponse>(`/ecommerce/galeria/${token}/compras/${compraId}`)
    return data
  },

  uploadComprovante: async (token: string, compraExtraId: string, comprovante: File): Promise<CompraExtraResponse> => {
    const formData = new FormData()
    formData.append('compraExtraId', compraExtraId)
    formData.append('comprovante', comprovante)
    const { data } = await apiClient.post<CompraExtraResponse>(`/ecommerce/galeria/${token}/comprovante`, formData)
    return data
  },

  downloadUrl: (token: string, fotoId: string): string => {
    return `${getBaseUrl()}/ecommerce/galeria/${token}/download/${fotoId}`
  },

  downloadZipUrl: (token: string): string => {
    return `${getBaseUrl()}/ecommerce/galeria/${token}/download-zip`
  },

  // Admin endpoints
  adminResumo: async (agendamentoId: string): Promise<AdminEcommerceResumoResponse> => {
    const { data } = await apiClient.get<AdminEcommerceResumoResponse>(`/admin/agendamentos/${agendamentoId}/ecommerce`)
    return data
  },

  adminOverrideSelecao: async (agendamentoId: string, fotoId: string, selecionada: boolean): Promise<FotoEnsaio> => {
    const { data } = await apiClient.patch<FotoEnsaio>(`/admin/agendamentos/${agendamentoId}/ecommerce/fotos/${fotoId}/selecao`, null, {
      params: { selecionada },
    })
    return data
  },

  adminRegenToken: async (agendamentoId: string): Promise<void> => {
    await apiClient.post(`/admin/agendamentos/${agendamentoId}/ecommerce/regen-token`)
  },

  // Admin compras
  adminListarCompras: async (params?: {
    status?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    perPage?: number
  }): Promise<any> => {
    const { data } = await apiClient.get('/admin/ecommerce/compras', { params })
    return data
  },

  adminCompraDetalhe: async (id: string): Promise<AdminCompraDetalheResponse> => {
    const { data } = await apiClient.get<AdminCompraDetalheResponse>(`/admin/ecommerce/compras/${id}`)
    return data
  },

  adminConfirmarCompra: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/ecommerce/compras/${id}/confirmar`)
  },

  adminCancelarCompra: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/ecommerce/compras/${id}/cancelar`)
  },

  adminRelatorioCompras: async (): Promise<AdminComprasRelatorioResponse> => {
    const { data } = await apiClient.get<AdminComprasRelatorioResponse>('/admin/ecommerce/compras/relatorio')
    return data
  },
}
