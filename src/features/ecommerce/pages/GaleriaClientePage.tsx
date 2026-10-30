import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Columns2, Search, ShieldAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { FotoEnsaio, CompraExtraResponse, MetodoPagamento, GaleriaStatusResponse } from '../types/ecommerce.types'
import type { GaleriaResponse } from '../services/ecommerce.service'
import { FotoViewer } from '../components/FotoViewer'
import { CheckoutDialog } from '../components/CheckoutDialog'
import { MinhasComprasSection } from '../components/MinhasComprasSection'
import { ComparadorFotos } from '../components/ComparadorFotos'
import { CartSummaryPanel } from '../components/CartSummaryPanel'
import { FavoritosPanel } from '../components/FavoritosPanel'
import { GaleriaHero } from '../components/galeria/GaleriaHero'
import { GaleriaNav } from '../components/galeria/GaleriaNav'
import { GaleriaIntro } from '../components/galeria/GaleriaIntro'
import { GaleriaRascunhoBanner } from '../components/galeria/GaleriaRascunhoBanner'
import { GaleriaGrid } from '../components/galeria/GaleriaGrid'
import { GaleriaDock } from '../components/galeria/GaleriaDock'
import { GaleriaExtraDialog } from '../components/galeria/GaleriaExtraDialog'
import { GaleriaConfirmarSelecao } from '../components/galeria/GaleriaConfirmarSelecao'
import { GaleriaTimeline } from '../components/galeria/GaleriaTimeline'
import { GaleriaArquivada } from '../components/galeria/GaleriaArquivada'
import { GaleriaEmPreparacao } from '../components/galeria/GaleriaEmPreparacao'
import { extractErrorMessage } from '@/shared/api'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { cn } from '@/shared/lib/cn'
import { humanizarNome } from '@/shared/lib/foto'

type FiltroGaleria = 'todas' | 'favoritas' | 'selecionadas' | 'extras'

function scrollSuavePara(id: string) {
  const elemento = document.getElementById(id)
  if (!elemento) return
  const topo = elemento.getBoundingClientRect().top + window.scrollY - 64
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: Math.max(0, topo), behavior: reduzir ? 'auto' : 'smooth' })
}

function formatarDataLonga(valor: string | null | undefined): string | null {
  if (!valor) return null
  const data = valor.length === 10 ? new Date(`${valor}T00:00:00`) : new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(data)
}

export function GaleriaClientePage() {
  const { token } = useParams<{ token: string }>()
  const [galeria, setGaleria] = useState<GaleriaResponse | null>(null)
  const [statusGaleria, setStatusGaleria] = useState<GaleriaStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arquivada, setArquivada] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [carrinhoIds, setCarrinhoIds] = useState<Set<string>>(new Set())
  const [carrinhoCount, setCarrinhoCount] = useState(0)
  const [cartLoadingIds, setCartLoadingIds] = useState<Set<string>>(new Set())
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  // Wishlist, comparação e carrinho lateral
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCart, setShowCart] = useState(false)
  const [showComparador, setShowComparador] = useState(false)
  const [showFavoritos, setShowFavoritos] = useState(false)
  const [showConfirmarSelecao, setShowConfirmarSelecao] = useState(false)
  const [isEnviandoSelecao, setIsEnviandoSelecao] = useState(false)
  const [showLimparRascunho, setShowLimparRascunho] = useState(false)
  const [isLimpandoRascunho, setIsLimpandoRascunho] = useState(false)
  const [fotoExtraPendente, setFotoExtraPendente] = useState<FotoEnsaio | null>(null)
  const [observacao, setObservacao] = useState('')

  // Filtros
  const [filtro, setFiltro] = useState<FiltroGaleria>('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchAberto, setSearchAberto] = useState(false)
  const [categoriaFilter, setCategoriaFilter] = useState<string>('')

  const fotos = galeria?.fotos ?? []
  const pacoteLimit = galeria?.pacoteQuantidadeFotos ?? 0
  const valorUnitario = galeria?.valorUnitarioFotoExtra ?? 15
  const modoGaleria = galeria?.modoGaleria ?? 'COM_EDICAO'
  const faseGaleria = galeria?.faseGaleria ?? 'COMERCIALIZACAO'
  const requerEdicao = galeria?.requerEdicao ?? (modoGaleria === 'COM_EDICAO')
  const podeSelecionar = galeria?.podeSelecionar ?? true
  const podeComprar = galeria?.podeComprar ?? true
  const podeBaixar = galeria?.podeBaixar ?? true
  // Durante a edição o cliente ainda pode marcar extras: eles entram na
  // seleção ativa para serem editados junto com o pacote. No fluxo sem edição
  // o cliente também pode anexar extras enquanto aguarda a aprovação.
  const emEdicaoGaleria = requerEdicao
    && (faseGaleria === 'SELECAO_ENVIADA' || faseGaleria === 'EM_EDICAO')
  const emAprovacaoGaleria = !requerEdicao
    && modoGaleria !== 'DIRETO'
    && faseGaleria === 'SELECAO_ENVIADA'
  const podeAdicionarExtras = podeSelecionar || podeComprar || emEdicaoGaleria || emAprovacaoGaleria
  const selecaoAtual = galeria?.selecaoAtual ?? null
  const valoresExtras = galeria?.valoresExtras ?? {}
  const extrasEmSelecao = modoGaleria !== 'DIRETO'
    && (faseGaleria === 'SELECAO' || emEdicaoGaleria || emAprovacaoGaleria)
  const valorUnitarioFoto = useCallback(
    (fotoId: string) => valoresExtras[fotoId] ?? valorUnitario,
    [valoresExtras, valorUnitario],
  )
  // No modo COM_EDICAO só há arquivo final depois de EDITADA. Nos modos
  // ENTREGA_DIRETA/DIRETO o arquivo já publicado é o entregável.
  const isDownloadable = (foto: FotoEnsaio) =>
    podeBaixar
    && (foto.selecionadaPacote || foto.status === 'PAGA')
    && (!requerEdicao || foto.versaoAtual === 'EDITADA')
  const downloadableFotos = fotos.filter(isDownloadable)
  const previsaoEntrega = statusGaleria
    && statusGaleria.etapa !== 'CONCLUIDA'
    && statusGaleria.etapa !== 'ARQUIVADA'
    && statusGaleria.etapa !== 'CLIENTE_BAIXOU'
    ? formatarDataLonga(statusGaleria.previsaoEntrega)
    : null

  const capa = useMemo(
    () => fotos.find((f) => f.destaque) ?? fotos[0] ?? null,
    [fotos],
  )
  const capaUrl = galeria?.capaUrl ?? null
  const selectedFotos = useMemo(
    () => fotos.filter((f) => selectedIds.has(f.id)),
    [fotos, selectedIds],
  )
  const extrasFotos = useMemo(
    () => fotos.filter((f) => carrinhoIds.has(f.id)),
    [fotos, carrinhoIds],
  )

  // Categorias disponíveis para filtro
  const categorias = useMemo(() => {
    const cats = new Set<string>()
    fotos.forEach((f) => { if (f.categoria) cats.add(f.categoria) })
    return Array.from(cats).sort()
  }, [fotos])

  // Fotos filtradas
  const filteredFotos = useMemo(() => {
    let result = fotos
    if (filtro === 'favoritas') {
      result = result.filter((f) => favoritoIds.has(f.id))
    } else if (filtro === 'selecionadas') {
      result = result.filter((f) => selectedIds.has(f.id))
    } else if (filtro === 'extras') {
      result = result.filter((f) => carrinhoIds.has(f.id))
    }
    if (categoriaFilter) {
      result = result.filter((f) => f.categoria === categoriaFilter)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter((f) =>
        (f.tags && f.tags.some((t) => t.toLowerCase().includes(term))) ||
        (f.titulo && f.titulo.toLowerCase().includes(term)) ||
        (f.fileName && f.fileName.toLowerCase().includes(term))
      )
    }
    return result
  }, [fotos, filtro, favoritoIds, selectedIds, carrinhoIds, categoriaFilter, searchTerm])

  const carregandoRef = useRef(false)
  const reabertaAnteriorRef = useRef(false)
  const carregarGaleria = useCallback(async (mostrarLoading = true, sincronizarSelecao = true) => {
    if (!token) return
    if (carregandoRef.current) return
    carregandoRef.current = true
    if (mostrarLoading) {
      setIsLoading(true)
      setStatusGaleria(null)
    }
    try {
      // O status publico nao bloqueia a galeria: ele chega em paralelo e
      // atualiza a tela quando estiver pronto.
      const data = await ecommerceService.galeria(token)
      setGaleria(data)
      setArquivada(false)
      if (sincronizarSelecao) {
        setSelectedIds(new Set(data.fotos.filter((f) => f.selecionadaPacote).map((f) => f.id)))
      }
      setError(null)
      void ecommerceService.galeriaStatus(token)
        .then(setStatusGaleria)
        .catch(() => {})
    } catch (err: unknown) {
      const resposta = (err as {
        response?: { status?: number; data?: { message?: string; code?: string } }
      })?.response
      if (resposta?.status === 410 && resposta.data?.code === 'GALERIA_ARQUIVADA') {
        setArquivada(true)
        setError(null)
        return
      }
      const msg = resposta?.data?.message || ''
      if (msg.includes('expirou')) {
        setError(msg)
      } else {
        setError('Galeria não encontrada ou não publicada')
      }
    } finally {
      carregandoRef.current = false
      if (mostrarLoading) setIsLoading(false)
    }
  }, [token])

  const atualizarTela = useCallback(async () => {
    if (!token || isRefreshing) return
    setIsRefreshing(true)
    try {
      await carregarGaleria(false)
    } finally {
      setIsRefreshing(false)
    }
  }, [token, isRefreshing, carregarGaleria])

  useEffect(() => {
    void carregarGaleria()
  }, [carregarGaleria])

  // Revalida ao voltar para a aba (inclusive bfcache) e a cada minuto. Isso
  // mantém capa, fase e seleção em dia sem exigir recarregar a página e sem
  // apagar uma seleção local em andamento.
  useEffect(() => {
    if (!token) return
    const atualizar = () => {
      if (document.visibilityState !== 'visible' || viewerIndex !== null) return
      void carregarGaleria(false, false)
    }
    const aoRetornar = (event: PageTransitionEvent) => {
      if (event.persisted) atualizar()
    }
    document.addEventListener('visibilitychange', atualizar)
    window.addEventListener('pageshow', aoRetornar)
    const intervalo = window.setInterval(atualizar, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', atualizar)
      window.removeEventListener('pageshow', aoRetornar)
      window.clearInterval(intervalo)
    }
  }, [token, viewerIndex, carregarGaleria])

  useEffect(() => {
    if (viewerIndex === null) return
    if (fotos.length === 0) {
      setViewerIndex(null)
      return
    }
    if (viewerIndex >= fotos.length) {
      setViewerIndex(fotos.length - 1)
    }
  }, [fotos.length, viewerIndex])

  useEffect(() => {
    if (!token || isLoading || error) return
    ecommerceService.listarCarrinho(token)
      .then((response) => {
        setCarrinhoIds(new Set(response.itens.map((item) => item.foto.id)))
        setCarrinhoCount(response.quantidade)
      })
      .catch(() => {})
    ecommerceService.listarFavoritos(token)
      .then((ids) => setFavoritoIds(new Set(ids)))
      .catch(() => {})
  }, [token, isLoading, error])

  useEffect(() => {
    if (!galeria) return
    const anterior = document.title
    const titulo = galeria.tituloHero?.trim() || humanizarNome(galeria.clienteNome)
    document.title = titulo ? `${titulo} · Galeria` : 'Galeria · Photoizer'
    return () => { document.title = anterior }
  }, [galeria])

  // Quando o staff reabre a seleção, o backend preserva `selecionadaPacote`.
  // Restaura esse rascunho no estado local apenas na transição para reaberta,
  // para o polling não sobrescrever alterações que o cliente ainda não salvou.
  useEffect(() => {
    if (!galeria) return
    const reaberta = galeria.selecaoReaberta && galeria.faseGaleria === 'SELECAO'
    if (reaberta && !reabertaAnteriorRef.current) {
      setSelectedIds(new Set(galeria.fotos.filter((f) => f.selecionadaPacote).map((f) => f.id)))
    }
    reabertaAnteriorRef.current = reaberta
  }, [galeria])

  useEffect(() => {
    if (filtro === 'extras' && carrinhoCount === 0) setFiltro('todas')
  }, [filtro, carrinhoCount])

  useEffect(() => {
    const url = capaUrl
    if (!url) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
    return () => { link.remove() }
  }, [capaUrl])

  const toggleFavorito = useCallback(async (fotoId: string) => {
    if (!token) return
    const isFavorito = favoritoIds.has(fotoId)
    // Otimista
    setFavoritoIds((prev) => {
      const next = new Set(prev)
      if (isFavorito) next.delete(fotoId)
      else next.add(fotoId)
      return next
    })
    try {
      if (isFavorito) await ecommerceService.removerFavorito(token, fotoId)
      else await ecommerceService.adicionarFavorito(token, fotoId)
    } catch (err: any) {
      // Reverte
      setFavoritoIds((prev) => {
        const next = new Set(prev)
        if (isFavorito) next.add(fotoId)
        else next.delete(fotoId)
        return next
      })
      toast.error(err?.response?.data?.message || 'Erro ao atualizar favoritos')
    }
  }, [token, favoritoIds])

  const toggleCompare = useCallback((fotoId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(fotoId)) {
        next.delete(fotoId)
      } else {
        if (next.size >= 4) {
          toast.error('Máximo de 4 fotos para comparação')
          return prev
        }
        next.add(fotoId)
      }
      return next
    })
  }, [])

  const toggleCarrinho = useCallback(async (fotoId: string) => {
    if (!token) return
    if (!podeAdicionarExtras) {
      toast.error('As fotos estão em edição. Aguarde a publicação para alterar o carrinho.')
      return
    }
    setCartLoadingIds((prev) => new Set(prev).add(fotoId))
    try {
      if (carrinhoIds.has(fotoId)) {
        await ecommerceService.removerDoCarrinho(token, fotoId)
        setCarrinhoIds((prev) => {
          const next = new Set(prev)
          next.delete(fotoId)
          return next
        })
        setCarrinhoCount((prev) => Math.max(0, prev - 1))
      } else {
        await ecommerceService.adicionarAoCarrinhoFoto(token, fotoId)
        setCarrinhoIds((prev) => new Set(prev).add(fotoId))
        setCarrinhoCount((prev) => prev + 1)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar carrinho')
    } finally {
      setCartLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(fotoId)
        return next
      })
    }
  }, [token, carrinhoIds, podeAdicionarExtras])

  const toggleSelect = useCallback(async (fotoId: string) => {
    if (!podeSelecionar) {
      toast.error('A seleção já foi enviada e está bloqueada para edição.')
      return
    }
    const foto = fotos.find((f) => f.id === fotoId)
    if (!foto) return

    if (selectedIds.has(fotoId)) {
      if (foto.downloadada) {
        toast.error('Foto já baixada não pode ser removida do pacote')
        return
      }
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(fotoId)
        return next
      })
      return
    }

    if (selectedIds.size < pacoteLimit) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.add(fotoId)
        return next
      })
      // Uma foto no pacote não pode continuar no carrinho: ela seria cobrada
      // novamente e o checkout recusaria a compra inteira.
      if (carrinhoIds.has(fotoId)) {
        await toggleCarrinho(fotoId)
      }
      return
    }

    if (carrinhoIds.has(fotoId)) {
      await toggleCarrinho(fotoId)
      return
    }

    // Pacote cheio: confirma com o cliente antes de transformar a foto em extra.
    setFotoExtraPendente(foto)
  }, [selectedIds, pacoteLimit, toggleCarrinho, podeSelecionar, fotos, carrinhoIds])

  const confirmarExtra = async () => {
    if (!fotoExtraPendente) return
    const fotoId = fotoExtraPendente.id
    // Fecha antes do request para evitar duplo clique no botão do diálogo.
    setFotoExtraPendente(null)
    await toggleCarrinho(fotoId)
  }

  // A sacola do grid so aparece depois que o pacote esta cheio (ou quando a
  // selecao ja foi fechada). Remover continua direto; incluir abre o dialogo
  // com o preco da foto para o cliente confirmar.
  const toggleExtra = useCallback((fotoId: string) => {
    if (!token || !podeAdicionarExtras) return
    if (carrinhoIds.has(fotoId)) {
      void toggleCarrinho(fotoId)
      return
    }
    const foto = fotos.find((f) => f.id === fotoId)
    if (foto) setFotoExtraPendente(foto)
  }, [token, podeAdicionarExtras, carrinhoIds, toggleCarrinho, fotos])

  const handleSaveSelection = async () => {
    if (!token || !podeSelecionar) return
    setIsSaving(true)
    try {
      const selected = Array.from(selectedIds)
      const deselected = fotos.filter((f) => f.selecionadaPacote && !selectedIds.has(f.id) && !f.downloadada).map((f) => f.id)
      if (selected.length > 0) {
        await ecommerceService.selecionar(token, selected, true)
      }
      if (deselected.length > 0) {
        await ecommerceService.selecionar(token, deselected, false)
      }
      // Aplica a intenção localmente: o payload do PATCH pode retornar
      // selecionadaPacote desatualizado (evento de domínio aplicado após o read).
      const selectedSet = new Set(selected)
      const deselectedSet = new Set(deselected)
      setGaleria((prev) => prev ? {
        ...prev,
        fotos: prev.fotos.map((f) => selectedSet.has(f.id)
          ? { ...f, selecionadaPacote: true }
          : deselectedSet.has(f.id)
            ? { ...f, selecionadaPacote: false }
            : f)
      } : prev)
      toast.success('Seleção salva!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar seleção')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLimparRascunho = async () => {
    if (!token) return
    setIsLimpandoRascunho(true)
    try {
      await ecommerceService.limparRascunho(token)
      setSelectedIds(new Set())
      setGaleria((prev) => prev ? {
        ...prev,
        fotos: prev.fotos.map((f) => f.selecionadaPacote ? { ...f, selecionadaPacote: false } : f),
      } : prev)
      setShowLimparRascunho(false)
      toast.success('Fotos do pacote desmarcadas. Seus extras foram mantidos.')
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao limpar as fotos do pacote'))
    } finally {
      setIsLimpandoRascunho(false)
    }
  }

  const handleEnviarSelecao = async () => {
    if (!token || selectedIds.size === 0 || isEnviandoSelecao) return
    setIsEnviandoSelecao(true)
    const extrasEsperados = carrinhoIds.size
    try {
      const selecao = await ecommerceService.enviarSelecao(token, Array.from(selectedIds), observacao)
      setShowConfirmarSelecao(false)
      setShowCheckout(false)
      setShowCart(false)
      setObservacao('')
      if (selecao.quantidadeExtras !== extrasEsperados) {
        toast.warning(
          `A seleção foi enviada com ${selecao.quantidadeExtras} extra(s), mas ${extrasEsperados} estavam no carrinho. Confirme com o estúdio.`,
        )
      } else {
        toast.success(requerEdicao
          ? 'Seleção enviada! O estúdio vai preparar as fotos para edição.'
          : 'Seleção enviada! O estúdio vai revisar e liberar suas fotos.')
      }
      await carregarGaleria(false)
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar a seleção. Recarregue a galeria e tente novamente.'))
    } finally {
      setIsEnviandoSelecao(false)
    }
  }

  const handleCheckout = async (metodoPagamento: MetodoPagamento): Promise<CompraExtraResponse> => {
    if (!token || carrinhoCount === 0) throw new Error('Carrinho vazio')
    if (!podeComprar) {
      throw new Error(requerEdicao
        ? 'A compra será liberada após a publicação da edição'
        : 'A compra será liberada após a aprovação da seleção')
    }
    const compra = await ecommerceService.checkout(token, metodoPagamento)
    setGaleria((prev) => prev ? {
      ...prev,
      fotos: prev.fotos.map((f) => carrinhoIds.has(f.id) ? { ...f, compraExtraId: compra.id, status: 'AGUARDANDO_COMPROVANTE' as const } : f)
    } : prev)
    setCarrinhoIds(new Set())
    setCarrinhoCount(0)
    return compra
  }

  const handleEnviarComprovante = async (compra: CompraExtraResponse, file: File) => {
    if (!token) return
    await ecommerceService.uploadComprovante(token, compra.id, file)
    setGaleria((prev) => prev ? {
      ...prev,
      fotos: prev.fotos.map((f) => f.compraExtraId === compra.id ? { ...f, status: 'AGUARDANDO_CONFIRMACAO' as const } : f)
    } : prev)
    toast.success('Comprovante enviado!')
  }

  const hasSelectionChanges = fotos.some((f) => f.selecionadaPacote !== selectedIds.has(f.id))
  const totalExtras = Array.from(carrinhoIds)
    .reduce((total, fotoId) => total + valorUnitarioFoto(fotoId), 0)
  const modalAberto = viewerIndex !== null
    || showComparador
    || showCart
    || showFavoritos
    || showCheckout
    || showConfirmarSelecao
    || fotoExtraPendente !== null
  const selecionando = modoGaleria !== 'DIRETO' && faseGaleria === 'SELECAO'
  const emComercializacao = modoGaleria !== 'DIRETO' && faseGaleria === 'COMERCIALIZACAO'
  const mostrarDock = !modalAberto && (
    selecionando
    || (emEdicaoGaleria && carrinhoCount > 0)
    || (emAprovacaoGaleria && carrinhoCount > 0)
    || (emComercializacao && (downloadableFotos.length > 0 || (podeComprar && carrinhoCount > 0)))
    || (modoGaleria === 'DIRETO' && (hasSelectionChanges || downloadableFotos.length > 0 || (podeComprar && carrinhoCount > 0)))
  )
  const mostrarTimeline = modoGaleria !== 'DIRETO' && faseGaleria !== 'SELECAO'
  const mostrarZonaEspera = modoGaleria !== 'DIRETO'
    && (faseGaleria === 'SELECAO_ENVIADA' || (requerEdicao && faseGaleria === 'EM_EDICAO'))

  const limparFiltros = () => {
    setFiltro('todas')
    setSearchTerm('')
    setCategoriaFilter('')
    setSearchAberto(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-gallery-bg">
        <div className="h-[68dvh] min-h-[460px] animate-pulse bg-gallery-line/50 sm:h-[78dvh]" />
        <div className="mx-auto mt-10 max-w-xl px-4 text-center">
          <div className="mx-auto h-3 w-24 animate-pulse rounded bg-gallery-line/60" />
          <div className="mx-auto mt-4 h-8 w-72 max-w-full animate-pulse rounded bg-gallery-line/60" />
          <div className="mx-auto mt-3 h-3 w-full max-w-md animate-pulse rounded bg-gallery-line/40" />
        </div>
        <div className="mx-auto mt-10 grid grid-cols-2 gap-2 px-4 sm:grid-cols-3 sm:gap-3 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/2] animate-pulse bg-gallery-line/40" />
          ))}
        </div>
      </div>
    )
  }

  if (arquivada) {
    return <GaleriaArquivada />
  }

  if (error) {
    const isExpired = error.includes('expirou')
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gallery-bg px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gallery-accent" />
          <h1 className="mt-4 text-balance font-display text-2xl text-gallery-ink">
            {isExpired ? 'Este link expirou' : 'Não conseguimos abrir sua galeria'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gallery-muted">{error}</p>
          <button
            onClick={() => void carregarGaleria()}
            className="mt-6 min-h-11 rounded-full bg-gallery-ink px-6 text-xs font-semibold text-gallery-bg transition-opacity hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (fotos.length === 0) {
    return (
      <GaleriaEmPreparacao
        status={statusGaleria}
        onRefresh={() => void atualizarTela()}
        isRefreshing={isRefreshing}
      />
    )
  }

  return (
    <div className={cn(
      'min-h-dvh bg-gallery-bg text-gallery-ink',
      mostrarDock && 'pb-[calc(6rem+env(safe-area-inset-bottom))]',
    )}>
      <GaleriaNav
        favoritos={favoritoIds.size}
        carrinho={carrinhoCount}
        onFavoritos={() => setShowFavoritos(true)}
        onCarrinho={() => setShowCart(true)}
      />

      <GaleriaHero
        foto={capa}
        capaUrl={capaUrl}
        titulo={galeria?.tituloHero?.trim() || humanizarNome(galeria?.clienteNome)}
        dataHoraEnsaio={galeria?.dataHoraEnsaio ?? ''}
        localEnsaio={galeria?.localEnsaio ?? null}
        onExplore={() => scrollSuavePara('galeria-conteudo')}
      />

      <main className="mx-auto w-full max-w-[1500px]">
        <GaleriaIntro
          modo={modoGaleria}
          fase={faseGaleria}
          requerEdicao={requerEdicao}
          pacoteNome={galeria?.pacoteNome ?? ''}
          pacoteLimit={pacoteLimit}
          selectedCount={selectedIds.size}
          favoritosCount={favoritoIds.size}
          carrinhoCount={carrinhoCount}
          previsaoEntrega={previsaoEntrega}
        />

        {galeria?.selecaoReaberta && faseGaleria === 'SELECAO' && (
          <GaleriaRascunhoBanner
            fotosNoPacote={selectedIds.size}
            extrasNoCarrinho={carrinhoCount}
            onLimparPacote={() => setShowLimparRascunho(true)}
          />
        )}

        {mostrarTimeline && (
          <GaleriaTimeline fase={faseGaleria} selecao={selecaoAtual} requerEdicao={requerEdicao} />
        )}

        {mostrarZonaEspera && (
          <div className="mx-auto mt-8 max-w-lg px-4">
            <div className="rounded-sm border border-gallery-line bg-gallery-surface px-5 py-4 text-center">
              <p className="text-sm font-medium text-gallery-ink">
                {requerEdicao
                  ? faseGaleria === 'SELECAO_ENVIADA'
                    ? 'Sua seleção está em boas mãos.'
                    : 'Estamos preparando suas fotos.'
                  : 'Seleção enviada!'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gallery-muted">
                {requerEdicao
                  ? 'Você pode continuar olhando a galeria e marcar fotos extras: elas entram na mesma edição e ficam disponíveis para compra após a publicação.'
                  : 'O estúdio vai revisar e liberar as fotos do seu pacote em instantes. Você ainda pode marcar extras; eles são liberados após a confirmação do pagamento.'}
              </p>
            </div>
          </div>
        )}

        {/* Filtros e busca */}
        <div className="mx-auto mt-8 w-full max-w-[1500px] border-y border-gallery-line">
          <div className="flex items-center gap-2 px-3 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {([
              { id: 'todas' as const, label: 'Todas', count: fotos.length },
              { id: 'favoritas' as const, label: 'Favoritas', count: favoritoIds.size },
              { id: 'selecionadas' as const, label: 'Pacote', count: selectedIds.size },
              ...(carrinhoCount > 0
                ? [{ id: 'extras' as const, label: 'Extras', count: carrinhoCount }]
                : []),
            ]).map((item) => (
              <button
                key={item.id}
                onClick={() => setFiltro(item.id)}
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors',
                  filtro === item.id
                    ? 'border-gallery-ink bg-gallery-ink text-gallery-bg'
                    : 'border-gallery-line text-gallery-muted hover:text-gallery-ink',
                )}
              >
                {item.label}
                <span className={cn('ml-1.5 tabular-nums', filtro === item.id ? 'text-gallery-bg/70' : 'text-gallery-muted')}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => setCompareMode((prev) => !prev)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                compareMode
                  ? 'border-gallery-ink bg-gallery-ink text-gallery-bg'
                  : 'border-gallery-line text-gallery-muted hover:text-gallery-ink',
              )}
              aria-pressed={compareMode}
              aria-label={compareMode ? 'Desativar comparação' : 'Ativar comparação'}
              title="Comparar fotos"
            >
              <Columns2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSearchAberto((prev) => !prev)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                searchAberto
                  ? 'border-gallery-ink bg-gallery-ink text-gallery-bg'
                  : 'border-gallery-line text-gallery-muted hover:text-gallery-ink',
              )}
              aria-pressed={searchAberto}
              aria-label={searchAberto ? 'Fechar busca' : 'Buscar fotos'}
              title="Buscar fotos"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

          {(searchAberto || categoriaFilter || searchTerm) && (
            <div className="flex flex-col gap-2 border-t border-gallery-line px-3 pb-3 pt-3 sm:flex-row sm:items-center sm:px-6">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gallery-muted" />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, título ou tag..."
                  className="w-full rounded-full border border-gallery-line bg-gallery-surface py-2.5 pl-9 pr-9 text-xs text-gallery-ink outline-none placeholder:text-gallery-muted/70 focus:ring-2 focus:ring-gallery-accent/40"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gallery-muted hover:text-gallery-ink"
                    aria-label="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {categorias.length > 0 && (
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="w-full rounded-full border border-gallery-line bg-gallery-surface px-3 py-2.5 text-xs text-gallery-ink outline-none focus:ring-2 focus:ring-gallery-accent/40 sm:w-auto"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
              {(filtro !== 'todas' || categoriaFilter || searchTerm) && (
                <button
                  onClick={limparFiltros}
                  className="self-start text-[11px] font-medium text-gallery-muted underline-offset-4 hover:text-gallery-ink hover:underline sm:self-auto"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-3 pb-14 pt-4 sm:px-6">
          {filteredFotos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-gallery-ink">Nenhuma foto encontrada</p>
              <p className="mt-2 text-sm text-gallery-muted">
                Tente outro filtro ou limpe a busca.
              </p>
              <button
                onClick={limparFiltros}
                className="mt-5 min-h-11 rounded-full border border-gallery-line bg-gallery-surface px-5 text-xs font-medium text-gallery-ink transition-colors hover:bg-gallery-line/40"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <GaleriaGrid
              fotos={filteredFotos}
              token={token ?? ''}
              selectedIds={selectedIds}
              carrinhoIds={carrinhoIds}
              pacoteLimit={pacoteLimit}
              cartLoadingIds={cartLoadingIds}
              favoritoIds={favoritoIds}
              compareIds={compareIds}
              compareMode={compareMode}
              modoGaleria={modoGaleria}
              faseGaleria={faseGaleria}
              podeSelecionar={podeSelecionar}
              podeComprar={podeAdicionarExtras}
              podeBaixar={podeBaixar}
              extrasEmSelecao={extrasEmSelecao}
              onSelect={toggleSelect}
              onToggleCarrinho={toggleExtra}
              onToggleFavorito={toggleFavorito}
              onToggleCompare={toggleCompare}
              onView={(index) => {
                const originalIndex = fotos.findIndex((f) => f.id === filteredFotos[index]?.id)
                if (originalIndex >= 0) {
                  setCommentsOpen(false)
                  setViewerIndex(originalIndex)
                }
              }}
            />
          )}
        </div>
      </main>

      {mostrarDock && (
        <GaleriaDock
          modo={modoGaleria}
          fase={faseGaleria}
          selectedCount={selectedIds.size}
          pacoteLimit={pacoteLimit}
          favoritosCount={favoritoIds.size}
          carrinhoCount={carrinhoCount}
          totalExtras={totalExtras}
          selectedFotos={selectedFotos}
          downloadableCount={downloadableFotos.length}
          hasSelectionChanges={hasSelectionChanges}
          podeComprar={podeComprar}
          isSaving={isSaving}
          isSending={isEnviandoSelecao}
          onSave={handleSaveSelection}
          onEnviar={() => setShowConfirmarSelecao(true)}
          onOpenCart={() => setShowCart(true)}
          onCheckout={() => { setShowCart(false); setShowCheckout(true) }}
          onDownloadZip={() => {
            if (token) window.location.assign(ecommerceService.downloadZipUrl(token))
          }}
        />
      )}

      {viewerIndex !== null && (
        <FotoViewer
          fotos={fotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onToggleSelect={toggleSelect}
          onNavigate={(i) => { setCommentsOpen(false); setViewerIndex(i) }}
          selectedIds={selectedIds}
          carrinhoIds={carrinhoIds}
          pacoteLimit={pacoteLimit}
          selectedCount={selectedIds.size}
          onToggleCarrinho={toggleCarrinho}
          valorUnitario={valorUnitario}
          cartLoadingIds={cartLoadingIds}
          token={token ?? ''}
          commentsOpen={commentsOpen}
          onCommentsOpenChange={setCommentsOpen}
          favoritoIds={favoritoIds}
          onToggleFavorito={toggleFavorito}
          podeSelecionar={podeSelecionar}
          podeComprar={podeAdicionarExtras}
          podeBaixar={podeBaixar}
          extrasEmSelecao={extrasEmSelecao}
          valoresExtras={valoresExtras}
          modoGaleria={modoGaleria}
          faseGaleria={faseGaleria}
          requerEdicao={requerEdicao}
        />
      )}

      {showComparador && (
        <ComparadorFotos
          fotos={fotos.filter((f) => compareIds.has(f.id))}
          onClose={() => setShowComparador(false)}
          selectedIds={selectedIds}
          pacoteLimit={pacoteLimit}
          podeSelecionar={podeSelecionar}
          onToggleSelect={toggleSelect}
        />
      )}

      <CartSummaryPanel
        open={showCart}
        onClose={() => setShowCart(false)}
        fotos={fotos}
        selectedIds={selectedIds}
        carrinhoIds={carrinhoIds}
        pacoteLimit={pacoteLimit}
        valorUnitario={valorUnitario}
        valoresExtras={valoresExtras}
        extrasEmSelecao={extrasEmSelecao}
        onRemoveFromCart={toggleCarrinho}
        podeComprar={podeComprar}
        podeEditarCarrinho={podeAdicionarExtras}
        onCheckout={() => { setShowCart(false); setShowCheckout(true) }}
      />

      <FavoritosPanel
        open={showFavoritos}
        onClose={() => setShowFavoritos(false)}
        fotos={fotos}
        favoritoIds={favoritoIds}
        selectedIds={selectedIds}
        carrinhoIds={carrinhoIds}
        pacoteLimit={pacoteLimit}
        valorUnitario={valorUnitario}
        valoresExtras={valoresExtras}
        extrasEmSelecao={extrasEmSelecao}
        podeSelecionar={podeSelecionar}
        podeComprar={podeAdicionarExtras}
        onToggleSelect={toggleSelect}
        onToggleCarrinho={toggleCarrinho}
        onToggleFavorito={toggleFavorito}
      />

      <CheckoutDialog
        token={token ?? ''}
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onCheckout={handleCheckout}
        onEnviarComprovante={handleEnviarComprovante}
      />

      <ConfirmDialog
        open={showLimparRascunho}
        onOpenChange={setShowLimparRascunho}
        onConfirm={() => void handleLimparRascunho()}
        title="Limpar fotos do pacote?"
        description="As fotos do pacote serão desmarcadas. Os extras no carrinho serão mantidos."
        confirmText="Limpar fotos do pacote"
        variant="destructive"
        isLoading={isLimpandoRascunho}
      />

      <GaleriaExtraDialog
        foto={fotoExtraPendente}
        open={fotoExtraPendente !== null}
        valor={fotoExtraPendente ? valorUnitarioFoto(fotoExtraPendente.id) : valorUnitario}
        extrasEmSelecao={extrasEmSelecao}
        fotoSeraEditada={!!fotoExtraPendente
          && requerEdicao
          && faseGaleria === 'COMERCIALIZACAO'
          && fotoExtraPendente.versaoAtual !== 'EDITADA'}
        onOpenChange={(open) => { if (!open) setFotoExtraPendente(null) }}
        onConfirm={confirmarExtra}
      />

      <GaleriaConfirmarSelecao
        open={showConfirmarSelecao}
        onOpenChange={setShowConfirmarSelecao}
        pacoteFotos={selectedFotos}
        extrasFotos={extrasFotos}
        observacao={observacao}
        onObservacaoChange={setObservacao}
        totalExtras={totalExtras}
        onConfirm={handleEnviarSelecao}
        isLoading={isEnviandoSelecao}
        requerEdicao={requerEdicao}
      />

      {token && (
        <div className="mx-auto w-full max-w-[1500px] px-3 pb-16 sm:px-6">
          <MinhasComprasSection token={token} modoGaleria={modoGaleria} />
        </div>
      )}
    </div>
  )
}
