import { apiClient, downloadProtected } from '@/shared/api'
import { env } from '@/shared/config/env'
import type { FotoEnsaio, CompraExtraResponse, AdminEcommerceResumoResponse, CarrinhoResponse, CalculoCarrinhoResponse, MetodoPagamento, AdminCompraDetalheResponse, AdminComprasRelatorioResponse, CompraExtraPendenteEdicaoResponse, Avaliacao, Sessao, EcommerceAnalyticsResponse, DashboardEcommerceResponse, DashboardEcommerceMensalResponse, FotoComentario, ComentariosPorFotoResponse, ConfiguracaoPagamentoResponse, SelecaoEnsaioResponse, SelecaoPendenteResponse, GaleriaEnsaioResponse, ModoGaleria, FaseGaleria, EtapaGaleria, GaleriaPipelineItem, GaleriaPipelineResumo, GaleriaStatusResponse, GaleriaPerformance } from '../types/ecommerce.types'
import type { PacoteResponse } from '@/features/pacotes/types/pacotes.types'
import type { AgendamentoCliente } from '@/features/auth/customer/types'
import type { PaginatedResponse } from '@/shared/types'

export interface GaleriaResponse {
  fotos: FotoEnsaio[]
  pacoteQuantidadeFotos: number
  valorUnitarioFotoExtra: number
  pacoteNome: string
  localEnsaio: string
  clienteNome: string | null
  tituloHero: string | null
  dataHoraEnsaio: string
  capaFotoId: string | null
  capaVersao: 'ORIGINAL' | 'EDITADA' | null
  capaUrl: string | null
  modoGaleria: ModoGaleria
  faseGaleria: FaseGaleria
  requerEdicao: boolean
  podeSelecionar: boolean
  podeComprar: boolean
  podeBaixar: boolean
  selecaoAtual: SelecaoEnsaioResponse | null
  selecaoReaberta: boolean
  valoresExtras: Record<string, number>
}

const SESSION_STORAGE_KEY = 'photoizer_cart_session'

function getBaseUrl() {
  return env.VITE_API_URL
}

let sessionPromise: Promise<string> | null = null

function invalidarSessao() {
  sessionPromise = null
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

function sessaoValidaFormato(sessao: string | null): sessao is string {
  if (!sessao) return false
  const dotIndex = sessao.indexOf('.')
  if (dotIndex <= 0) return false
  const uuid = sessao.slice(0, dotIndex)
  const assinatura = sessao.slice(dotIndex + 1)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
    && assinatura.length === 64
}

async function obterSessao(): Promise<string> {
  const armazenada = localStorage.getItem(SESSION_STORAGE_KEY)
  if (sessaoValidaFormato(armazenada)) return armazenada
  if (armazenada) invalidarSessao()
  if (!sessionPromise) {
    sessionPromise = apiClient
      .post<{ sessao: string }>('/ecommerce/sessao')
      .then(({ data }) => {
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessao)
        return data.sessao
      })
      .finally(() => {
        sessionPromise = null
      })
  }
  return sessionPromise
}

/**
 * Executa uma operação do carrinho com a sessão assinada.
 * Se o servidor rejeitar a sessão (400/401/422 "Sessão inválida"), reemite uma
 * nova e tenta uma única vez. A detecção é feita pelo código de erro
 * (`SESSAO_INVALIDA`) ou pela mensagem, para não depender do status exato.
 *
 * `permitirNovaSessao = false` é usado no envio da seleção: recriar a sessão
 * ali descartaria os extras do carrinho silenciosamente.
 */
async function comSessao<T>(
  fn: (sessionId: string) => Promise<T>,
  permitirNovaSessao = true,
): Promise<T> {
  try {
    return await fn(await obterSessao())
  } catch (err) {
    const data = (err as { response?: { data?: { code?: string; message?: string } } })?.response?.data
    const sessaoInvalida = data?.code === 'SESSAO_INVALIDA' || /sess/.test(String(data?.message).toLowerCase())
    if (sessaoInvalida && permitirNovaSessao) {
      invalidarSessao()
      return await fn(await obterSessao())
    }
    throw err
  }
}

export const ecommerceService = {
  obterSessao,

  galeria: async (token: string): Promise<GaleriaResponse> => {
    const { data } = await apiClient.get<GaleriaResponse>(`/ecommerce/galeria/${token}`)
    return data
  },

  galeriaStatus: async (token: string): Promise<GaleriaStatusResponse> => {
    const { data } = await apiClient.get<GaleriaStatusResponse>(`/ecommerce/galeria/${token}/status`)
    return data
  },

  obterPagamento: async (): Promise<ConfiguracaoPagamentoResponse> => {
    const { data } = await apiClient.get<ConfiguracaoPagamentoResponse>('/ecommerce/pagamento')
    return data
  },

  limparRascunho: async (token: string): Promise<void> => {
    await apiClient.delete(`/ecommerce/galeria/${token}/rascunho`)
  },

  selecionar: async (token: string, fotoIds: string[], selecionada: boolean): Promise<FotoEnsaio[]> => {
    const { data } = await apiClient.patch<FotoEnsaio[]>(`/ecommerce/galeria/${token}/selecionar`, {
      fotoIds,
      selecionada,
    })
    // Defensivo: o backend pode retornar selecionadaPacote desatualizado
    // (evento de domínio aplicado após o read). Preserva o valor local para
    // não regredir a marcação visual de quem consome o retorno diretamente.
    const ids = new Set(fotoIds)
    return data.map((foto) => (ids.has(foto.id) ? { ...foto, selecionadaPacote: selecionada } : foto))
  },

  enviarSelecao: async (
    token: string,
    fotoIdsPacote: string[],
    observacao?: string,
  ): Promise<SelecaoEnsaioResponse> => {
    // Não recria a sessão aqui: uma sessão nova nasce com carrinho vazio e
    // enviaria a seleção sem os extras, silenciosamente. É melhor falhar e
    // pedir para o cliente recarregar/refazer o carrinho.
    return comSessao((sessionId) =>
      apiClient.post<SelecaoEnsaioResponse>(
        `/ecommerce/galeria/${token}/selecao`,
        { fotoIdsPacote, observacao: observacao?.trim() || undefined },
        { headers: { 'X-Session-Id': sessionId } },
      ).then(({ data }) => data), false)
  },

  selecaoAtiva: async (token: string): Promise<SelecaoEnsaioResponse | null> => {
    const { data, status } = await apiClient.get<SelecaoEnsaioResponse>(
      `/ecommerce/galeria/${token}/selecao`,
      { validateStatus: (s) => s === 200 || s === 204 },
    )
    return status === 204 ? null : data
  },

  adicionarAoCarrinho: async (token: string): Promise<void> => {
    await comSessao((sessionId) =>
      apiClient.post(`/ecommerce/galeria/${token}/carrinho`, null, { headers: { 'X-Session-Id': sessionId } }))
  },

  adicionarAoCarrinhoFoto: async (token: string, fotoId: string): Promise<void> => {
    await comSessao((sessionId) =>
      apiClient.post(`/ecommerce/galeria/${token}/carrinho`, { fotoId }, { headers: { 'X-Session-Id': sessionId } }))
  },

  removerDoCarrinho: async (token: string, fotoId: string): Promise<void> => {
    await comSessao((sessionId) =>
      apiClient.delete(`/ecommerce/galeria/${token}/carrinho/${fotoId}`, { headers: { 'X-Session-Id': sessionId } }))
  },

  listarCarrinho: async (token: string): Promise<CarrinhoResponse> => {
    return comSessao((sessionId) =>
      apiClient.get<CarrinhoResponse>(`/ecommerce/galeria/${token}/carrinho`, { headers: { 'X-Session-Id': sessionId } }).then(({ data }) => data))
  },

  contarCarrinho: async (token: string): Promise<number> => {
    return comSessao((sessionId) =>
      apiClient.get<number>(`/ecommerce/galeria/${token}/carrinho/quantidade`, { headers: { 'X-Session-Id': sessionId } }).then(({ data }) => data))
  },

  calcular: async (token: string): Promise<CalculoCarrinhoResponse> => {
    return comSessao((sessionId) =>
      apiClient.get<CalculoCarrinhoResponse>(`/ecommerce/galeria/${token}/calcular`, { headers: { 'X-Session-Id': sessionId } }).then(({ data }) => data))
  },

  checkout: async (token: string, metodoPagamento?: MetodoPagamento): Promise<CompraExtraResponse> => {
    return comSessao((sessionId) =>
      apiClient.post<CompraExtraResponse>(`/ecommerce/galeria/${token}/checkout`,
        metodoPagamento ? { metodoPagamento } : null,
        { headers: { 'X-Session-Id': sessionId } }).then(({ data }) => data))
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

  // Favoritos / Wishlist
  adicionarFavorito: async (token: string, fotoId: string): Promise<void> => {
    await comSessao((sessionId) =>
      apiClient.post(`/ecommerce/galeria/${token}/favoritos/${fotoId}`, null, { headers: { 'X-Session-Id': sessionId } }))
  },

  removerFavorito: async (token: string, fotoId: string): Promise<void> => {
    await comSessao((sessionId) =>
      apiClient.delete(`/ecommerce/galeria/${token}/favoritos/${fotoId}`, { headers: { 'X-Session-Id': sessionId } }))
  },

  listarFavoritos: async (token: string): Promise<string[]> => {
    return comSessao((sessionId) =>
      apiClient.get<string[]>(`/ecommerce/galeria/${token}/favoritos`, { headers: { 'X-Session-Id': sessionId } }).then(({ data }) => data))
  },

  // Comentários por foto
  comentarFoto: async (token: string, fotoId: string, payload: { mensagem: string; autorNome?: string }): Promise<FotoComentario> => {
    const { data } = await apiClient.post<FotoComentario>(`/ecommerce/galeria/${token}/fotos/${fotoId}/comentarios`, payload)
    return data
  },

  listarComentarios: async (token: string, fotoId: string): Promise<FotoComentario[]> => {
    const { data } = await apiClient.get<FotoComentario[]>(`/ecommerce/galeria/${token}/fotos/${fotoId}/comentarios`)
    return data
  },

  downloadUrl: (token: string, fotoId: string): string => {
    return `${getBaseUrl()}/ecommerce/galeria/${token}/download/${fotoId}`
  },

  downloadZipUrl: (token: string): string => {
    return `${getBaseUrl()}/ecommerce/galeria/${token}/download-zip`
  },

  comprovanteUrl: (token: string, compraId: string): string => {
    return `${getBaseUrl()}/ecommerce/galeria/${token}/compras/${compraId}/comprovante`
  },

  // Admin endpoints
  adminResumo: async (agendamentoId: string): Promise<AdminEcommerceResumoResponse> => {
    const { data } = await apiClient.get<AdminEcommerceResumoResponse>(`/admin/agendamentos/${agendamentoId}/ecommerce`)
    return data
  },

  adminGaleriaPipeline: async (params?: {
    etapa?: EtapaGaleria
    busca?: string
    atrasadas?: boolean
    page?: number
    perPage?: number
  }): Promise<PaginatedResponse<GaleriaPipelineItem>> => {
    const { data } = await apiClient.get<PaginatedResponse<GaleriaPipelineItem>>(
      '/admin/galerias/pipeline', { params })
    return data
  },

  adminGaleriaPipelineResumo: async (): Promise<GaleriaPipelineResumo> => {
    const { data } = await apiClient.get<GaleriaPipelineResumo>('/admin/galerias/pipeline/resumo')
    return data
  },

  adminGaleriaPerformance: async (meses: number = 6): Promise<GaleriaPerformance> => {
    const { data } = await apiClient.get<GaleriaPerformance>('/admin/galerias/desempenho', {
      params: { meses },
    })
    return data
  },

  adminExportarGaleriaPipeline: async (params?: {
    etapa?: EtapaGaleria
    busca?: string
    atrasadas?: boolean
  }): Promise<void> => {
    const query = new URLSearchParams()
    if (params?.etapa) query.set('etapa', params.etapa)
    if (params?.busca) query.set('busca', params.busca)
    if (params?.atrasadas) query.set('atrasadas', 'true')
    const sufixo = query.toString()
    await downloadProtected(
      `/admin/galerias/pipeline/export.csv${sufixo ? `?${sufixo}` : ''}`,
      'galerias.csv',
    )
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

  adminGaleria: async (agendamentoId: string): Promise<GaleriaEnsaioResponse> => {
    const { data } = await apiClient.get<GaleriaEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/galeria`)
    return data
  },

  adminAlterarModoGaleria: async (
    agendamentoId: string,
    modo: ModoGaleria,
  ): Promise<GaleriaEnsaioResponse> => {
    const { data } = await apiClient.put<GaleriaEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/galeria/modo`, { modo })
    return data
  },

  adminDefinirCapaGaleria: async (
    agendamentoId: string,
    fotoId: string | null,
  ): Promise<GaleriaEnsaioResponse> => {
    const { data } = await apiClient.put<GaleriaEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/galeria/capa`, { fotoId })
    return data
  },

  adminAtualizarTituloGaleria: async (
    agendamentoId: string,
    tituloHero: string | null,
  ): Promise<GaleriaEnsaioResponse> => {
    const { data } = await apiClient.put<GaleriaEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/galeria/titulo`, { tituloHero })
    return data
  },

  adminSelecoesPendentes: async (): Promise<SelecaoPendenteResponse[]> => {
    const { data } = await apiClient.get<SelecaoPendenteResponse[]>('/admin/selecoes/pendentes')
    return data
  },

  adminSelecoesDoAgendamento: async (agendamentoId: string): Promise<SelecaoEnsaioResponse[]> => {
    const { data } = await apiClient.get<SelecaoEnsaioResponse[]>(
      `/admin/agendamentos/${agendamentoId}/selecoes`)
    return data
  },

  adminSelecaoDetalhe: async (
    agendamentoId: string,
    selecaoId: string,
  ): Promise<SelecaoEnsaioResponse> => {
    const { data } = await apiClient.get<SelecaoEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/selecoes/${selecaoId}`)
    return data
  },

  adminIniciarSelecao: async (
    agendamentoId: string,
    selecaoId: string,
  ): Promise<SelecaoEnsaioResponse> => {
    const { data } = await apiClient.post<SelecaoEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/selecoes/${selecaoId}/iniciar`)
    return data
  },

  adminReabrirSelecao: async (
    agendamentoId: string,
    selecaoId: string,
  ): Promise<SelecaoEnsaioResponse> => {
    const { data } = await apiClient.post<SelecaoEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/selecoes/${selecaoId}/reabrir`)
    return data
  },

  adminPublicarSelecao: async (
    agendamentoId: string,
    selecaoId: string,
  ): Promise<SelecaoEnsaioResponse> => {
    const { data } = await apiClient.post<SelecaoEnsaioResponse>(
      `/admin/agendamentos/${agendamentoId}/selecoes/${selecaoId}/publicar`)
    return data
  },

  adminSelecaoZipUrl: (agendamentoId: string, selecaoId: string): string => {
    return `${getBaseUrl()}/admin/agendamentos/${agendamentoId}/selecoes/${selecaoId}/download-zip`
  },

  // Admin comentários
  adminListarComentarios: async (agendamentoId: string): Promise<ComentariosPorFotoResponse[]> => {
    const { data } = await apiClient.get<ComentariosPorFotoResponse[]>(`/ecommerce/admin/comentarios/agendamentos/${agendamentoId}`)
    return data
  },

  adminResponderComentario: async (agendamentoId: string, fotoId: string, payload: { mensagem: string; autorNome?: string }): Promise<FotoComentario> => {
    const { data } = await apiClient.post<FotoComentario>(`/ecommerce/admin/comentarios/agendamentos/${agendamentoId}/fotos/${fotoId}/comentarios`, payload)
    return data
  },

  adminMarcarComentariosLidos: async (agendamentoId: string, fotoId: string): Promise<void> => {
    await apiClient.patch(`/ecommerce/admin/comentarios/agendamentos/${agendamentoId}/fotos/${fotoId}/comentarios/lidas`)
  },

  // Admin compras
  adminListarCompras: async (params?: {
    status?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    perPage?: number
  }): Promise<PaginatedResponse<CompraExtraResponse>> => {
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

  adminCancelarCompra: async (id: string, motivo?: string): Promise<void> => {
    await apiClient.patch(`/admin/ecommerce/compras/${id}/cancelar`, motivo ? { motivo } : undefined)
  },

  adminRelatorioCompras: async (): Promise<AdminComprasRelatorioResponse> => {
    const { data } = await apiClient.get<AdminComprasRelatorioResponse>('/admin/ecommerce/compras/relatorio')
    return data
  },

  adminExtrasPendentesEdicao: async (
    agendamentoId?: string,
  ): Promise<CompraExtraPendenteEdicaoResponse[]> => {
    const { data } = await apiClient.get<CompraExtraPendenteEdicaoResponse[]>(
      '/admin/ecommerce/extras/pendentes-edicao',
      { params: agendamentoId ? { agendamentoId } : undefined },
    )
    return data
  },

  adminAtualizarLinkPagamento: async (id: string, linkPagamentoCartao: string | null): Promise<CompraExtraResponse> => {
    const { data } = await apiClient.patch<CompraExtraResponse>(
      `/admin/ecommerce/compras/${id}/link-pagamento`,
      { linkPagamentoCartao },
    )
    return data
  },

  adminObterPagamento: async (): Promise<ConfiguracaoPagamentoResponse> => {
    const { data } = await apiClient.get<ConfiguracaoPagamentoResponse>('/admin/ecommerce/pagamento')
    return data
  },

  adminAtualizarPagamento: async (payload: {
    pixChave: string | null
    pixTipoChave: string | null
  }): Promise<ConfiguracaoPagamentoResponse> => {
    const { data } = await apiClient.put<ConfiguracaoPagamentoResponse>('/admin/ecommerce/pagamento', payload)
    return data
  },

  adminAnalytics: async (): Promise<EcommerceAnalyticsResponse> => {
    const { data } = await apiClient.get<EcommerceAnalyticsResponse>('/admin/ecommerce/analytics')
    return data
  },

  dashboardEcommerce: async (): Promise<DashboardEcommerceResponse> => {
    const { data } = await apiClient.get<DashboardEcommerceResponse>('/dashboard/ecommerce')
    return data
  },

  dashboardEcommerceMensal: async (meses: number = 6): Promise<DashboardEcommerceMensalResponse> => {
    const { data } = await apiClient.get<DashboardEcommerceMensalResponse>('/dashboard/ecommerce/mensal', {
      params: { meses },
    })
    return data
  },

  // Novos endpoints do e-commerce aprimorado

  // Pacotes com novos campos
  listarPacotesCompletos: async (): Promise<PacoteResponse[]> => {
    const { data } = await apiClient.get<PacoteResponse[]>('/pacotes/all')
    return data
  },

  buscarPacote: async (id: string): Promise<PacoteResponse> => {
    const { data } = await apiClient.get<PacoteResponse>(`/pacotes/${id}`)
    return data
  },

  // Avaliações
  criarAvaliacao: async (avaliacao: Omit<Avaliacao, 'id' | 'aprovado' | 'createdAt'>): Promise<Avaliacao> => {
    const { data } = await apiClient.post<Avaliacao>('/avaliacoes', avaliacao)
    return data
  },

  listarDepoimentos: async (): Promise<Avaliacao[]> => {
    const { data } = await apiClient.get<Avaliacao[]>('/avaliacoes/depoimentos')
    return data
  },

  listarAvaliacoesCliente: async (clienteId: string): Promise<Avaliacao[]> => {
    const { data } = await apiClient.get<Avaliacao[]>(`/avaliacoes/cliente/${clienteId}`)
    return data
  },

  listarAgendamentosCliente: async (): Promise<AgendamentoCliente[]> => {
    const { data } = await apiClient.get<AgendamentoCliente[]>('/auth/cliente/agendamentos')
    return data
  },

  // Sessões
  criarSessao: async (sessao: Omit<Sessao, 'id' | 'auditInfo'>): Promise<Sessao> => {
    const { data } = await apiClient.post<Sessao>('/sessoes', sessao)
    return data
  },

  listarSessoes: async (): Promise<Sessao[]> => {
    const { data } = await apiClient.get<Sessao[]>('/sessoes')
    return data
  },

}
