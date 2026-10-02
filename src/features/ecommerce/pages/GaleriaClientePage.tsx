import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldAlert, Camera, ShoppingCart, Download, Search, Filter, X, Heart, Columns2 } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { FotoEnsaio, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import type { GaleriaResponse } from '../services/ecommerce.service'
import { FotoViewer } from '../components/FotoViewer'
import { PhotoGrid } from '../components/PhotoGrid'
import { CheckoutDialog } from '../components/CheckoutDialog'
import { MinhasComprasSection } from '../components/MinhasComprasSection'
import { ComparadorFotos } from '../components/ComparadorFotos'
import { CartSummaryPanel } from '../components/CartSummaryPanel'
import { FavoritosPanel } from '../components/FavoritosPanel'
import { cn } from '@/shared/lib/cn'


export function GaleriaClientePage() {
  const { token } = useParams<{ token: string }>()
  const [galeria, setGaleria] = useState<GaleriaResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('')

  const fotos = galeria?.fotos ?? []
  const pacoteLimit = galeria?.pacoteQuantidadeFotos ?? 0
  const valorUnitario = galeria?.valorUnitarioFotoExtra ?? 15
  const isDownloadable = (foto: FotoEnsaio) => foto.selecionadaPacote || foto.status === 'PAGA'
  const downloadableFotos = fotos.filter(isDownloadable)

  // Categorias disponíveis para filtro
  const categorias = useMemo(() => {
    const cats = new Set<string>()
    fotos.forEach((f) => { if (f.categoria) cats.add(f.categoria) })
    return Array.from(cats).sort()
  }, [fotos])

  // Fotos filtradas
  const filteredFotos = useMemo(() => {
    let result = fotos
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
  }, [fotos, categoriaFilter, searchTerm])

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    ecommerceService.galeria(token)
      .then((data) => {
        setGaleria(data)
        setSelectedIds(new Set(data.fotos.filter((f) => f.selecionadaPacote).map((f) => f.id)))
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || ''
        if (msg.includes('expirou')) {
          setError(msg)
        } else {
          setError('Galeria não encontrada ou não publicada')
        }
      })
      .finally(() => setIsLoading(false))
  }, [token])

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
  }, [token, carrinhoIds])

  const toggleSelect = useCallback((fotoId: string) => {
    if (selectedIds.has(fotoId)) {
      const foto = fotos.find((f) => f.id === fotoId)
      if (foto?.downloadada) {
        toast.error('Foto já baixada não pode ser removida do pacote')
        return
      }
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(fotoId)
        return next
      })
    } else if (selectedIds.size < pacoteLimit) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.add(fotoId)
        return next
      })
    } else {
      toggleCarrinho(fotoId)
    }
  }, [selectedIds, pacoteLimit, toggleCarrinho])

  const handleSaveSelection = async () => {
    if (!token) return
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

  const handleCheckout = async (metodoPagamento: MetodoPagamento): Promise<CompraExtraResponse> => {
    if (!token || carrinhoCount === 0) throw new Error('Carrinho vazio')
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
  const totalExtras = carrinhoCount * valorUnitario

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-amber-50">
        <div className="sticky top-0 z-40 border-b border-cyan-100 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="h-4 w-48 animate-pulse rounded bg-cyan-100" />
          <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded bg-cyan-50" />
        </div>
        <div className="px-4 py-6 md:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] animate-pulse rounded-xl bg-white/70 ring-1 ring-cyan-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const isExpired = error.includes('expirou')
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-cyan-100 to-amber-50">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl bg-white/95 p-8 text-center shadow-sm ring-1 ring-cyan-100 backdrop-blur">
          <ShieldAlert className={`h-12 w-12 ${isExpired ? 'text-amber-500' : 'text-cyan-500'}`} />
          <h1 className="font-display text-lg font-semibold text-cyan-950">{isExpired ? 'Link Expirado' : 'Galeria não disponível'}</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (fotos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-cyan-100 to-amber-50">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl bg-white/95 p-8 text-center shadow-sm ring-1 ring-cyan-100 backdrop-blur">
          <Camera className="h-12 w-12 text-cyan-400" />
          <h1 className="font-display text-lg font-semibold text-cyan-950">Nenhuma foto publicada</h1>
          <p className="text-sm text-slate-500">As fotos ainda não foram publicadas. Volte mais tarde.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-amber-50/40 to-amber-50" onContextMenu={(e) => e.preventDefault()}>
      <header className="sticky top-0 z-40 border-b border-cyan-100 bg-white/85 backdrop-blur">
        <div className="flex flex-col gap-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-400 px-4 py-3 text-white md:h-14 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-semibold">{galeria?.pacoteNome || 'Sua Galeria de Fotos'}</h1>
            <p className="truncate text-[11px] text-white/85">
              {selectedIds.size} de {pacoteLimit} no pacote
              {carrinhoCount > 0 && ` · ${carrinhoCount} extra(s): R$ ${totalExtras.toFixed(2)}`}
              {filteredFotos.length < fotos.length && ` · ${filteredFotos.length} exibidas`}
              {galeria?.localEnsaio && ` · ${galeria.localEnsaio}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:overflow-x-auto md:overflow-y-visible">
            <button onClick={() => setShowFavoritos(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/20"
              title="Fotos que você marcou como Gostei">
              <Heart className={cn('h-3.5 w-3.5', favoritoIds.size > 0 ? 'text-rose-300' : 'text-white/90')} fill={favoritoIds.size > 0 ? 'currentColor' : 'none'} />
              Gostei{favoritoIds.size > 0 ? ` (${favoritoIds.size})` : ''}
            </button>
            <button onClick={() => setCompareMode((prev) => !prev)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                compareMode ? 'border-white bg-white text-cyan-700 hover:bg-white/90' : 'border-white/30 bg-white/10 hover:bg-white/20'
              }`}>
              <Columns2 className="h-3.5 w-3.5" />
              Comparar
            </button>
            {compareMode && compareIds.size >= 2 && (
              <button onClick={() => setShowComparador(true)}
                className="shrink-0 rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-white/90">
                Ver comparação ({compareIds.size})
              </button>
            )}
            <button onClick={() => setShowCart(true)}
              className="relative shrink-0 rounded-xl border border-white/30 bg-white/10 p-2.5 transition-colors hover:bg-white/20" title="Meu carrinho">
              <ShoppingCart className="h-4 w-4" />
              {carrinhoCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-400 px-0.5 text-[10px] font-medium text-white">
                  {carrinhoCount}
                </span>
              )}
            </button>
            {hasSelectionChanges && (
              <button onClick={handleSaveSelection} disabled={isSaving}
                className="shrink-0 rounded-xl bg-white px-3 py-2.5 text-xs font-medium text-cyan-700 transition-colors hover:bg-white/90 disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar Seleção'}
              </button>
            )}
            {downloadableFotos.length > 0 && (
              <a href={ecommerceService.downloadZipUrl(token ?? '')}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/20">
                <Download className="h-3.5 w-3.5" />
                ZIP ({downloadableFotos.length})
              </a>
            )}
            {carrinhoCount > 0 && (
              <button onClick={() => setShowCheckout(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 px-3 py-2.5 text-xs font-semibold text-white shadow transition-colors hover:from-orange-500 hover:to-rose-500">
                <ShoppingCart className="h-3.5 w-3.5" />
                Finalizar ({carrinhoCount})
              </button>
            )}
          </div>
        </div>
        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-3 md:px-6">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tags ou nome..."
              className="w-full rounded-xl border border-cyan-100 bg-white py-2.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-cyan-200" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-slate-400" />
              </button>
            )}
          </div>
          {categorias.length > 0 && (
            <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}
              className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-cyan-200">
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          {(categoriaFilter || searchTerm) && (
            <button onClick={() => { setCategoriaFilter(''); setSearchTerm('') }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-700">
              <Filter className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </header>

      {/* Barra de progresso do pacote */}
      <div className="px-4 pb-1 pt-4 md:px-6">
        <div className="rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-cyan-100 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-cyan-950">
                Fotos no pacote: {selectedIds.size} de {pacoteLimit}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {selectedIds.size >= pacoteLimit
                  ? 'Limite do pacote atingido'
                  : `Você pode selecionar mais ${pacoteLimit - selectedIds.size} foto(s)`}
                {carrinhoCount > 0 && ` · Carrinho: ${carrinhoCount} extra(s) · R$ ${(carrinhoCount * valorUnitario).toFixed(2)}`}
              </p>
            </div>
            <span className="text-xs font-medium text-cyan-700">
              {pacoteLimit > 0 ? Math.round((selectedIds.size / pacoteLimit) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cyan-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                selectedIds.size >= pacoteLimit
                  ? 'bg-gradient-to-r from-orange-400 to-rose-400'
                  : 'bg-gradient-to-r from-cyan-400 to-teal-400'
              }`}
              style={{ width: `${Math.min((selectedIds.size / pacoteLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6">
        <PhotoGrid
          fotos={filteredFotos}
          token={token ?? ''}
          selectedIds={selectedIds}
          carrinhoIds={carrinhoIds}
          cartLoadingIds={cartLoadingIds}
          pacoteLimit={pacoteLimit}
          valorUnitario={valorUnitario}
          favoritoIds={favoritoIds}
          compareIds={compareIds}
          compareMode={compareMode}
          onSelect={toggleSelect}
          onToggleCarrinho={toggleCarrinho}
          onToggleFavorito={toggleFavorito}
          onToggleCompare={toggleCompare}
          onView={(index) => {
            // Find the index in the original fotos array for the viewer
            const originalIndex = fotos.findIndex((f) => f.id === filteredFotos[index]?.id)
            if (originalIndex >= 0) {
              setCommentsOpen(false)
              setViewerIndex(originalIndex)
            }
          }}
          onOpenComments={(index) => {
            const originalIndex = fotos.findIndex((f) => f.id === filteredFotos[index]?.id)
            if (originalIndex >= 0) {
              setViewerIndex(originalIndex)
              setCommentsOpen(true)
            }
          }} />

        {token && <MinhasComprasSection token={token} />}
      </div>

      {viewerIndex !== null && (
        <FotoViewer fotos={fotos} currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)} onToggleSelect={toggleSelect}
          onNavigate={(i) => { setCommentsOpen(false); setViewerIndex(i) }} selectedIds={selectedIds}
          carrinhoIds={carrinhoIds} pacoteLimit={pacoteLimit}
          selectedCount={selectedIds.size} onToggleCarrinho={toggleCarrinho}
          valorUnitario={valorUnitario} cartLoadingIds={cartLoadingIds}
          token={token ?? ''} commentsOpen={commentsOpen} onCommentsOpenChange={setCommentsOpen}
          favoritoIds={favoritoIds} onToggleFavorito={toggleFavorito} />
      )}

      {showComparador && (
        <ComparadorFotos
          fotos={fotos.filter((f) => compareIds.has(f.id))}
          onClose={() => setShowComparador(false)}
          selectedIds={selectedIds}
          pacoteLimit={pacoteLimit}
          onToggleSelect={toggleSelect} />
      )}

      <CartSummaryPanel
        open={showCart}
        onClose={() => setShowCart(false)}
        fotos={fotos}
        selectedIds={selectedIds}
        carrinhoIds={carrinhoIds}
        pacoteLimit={pacoteLimit}
        valorUnitario={valorUnitario}
        onRemoveFromCart={toggleCarrinho}
        onCheckout={() => { setShowCart(false); setShowCheckout(true) }} />

      <FavoritosPanel
        open={showFavoritos}
        onClose={() => setShowFavoritos(false)}
        fotos={fotos}
        favoritoIds={favoritoIds}
        selectedIds={selectedIds}
        carrinhoIds={carrinhoIds}
        pacoteLimit={pacoteLimit}
        valorUnitario={valorUnitario}
        onToggleSelect={toggleSelect}
        onToggleCarrinho={toggleCarrinho}
        onToggleFavorito={toggleFavorito} />

      <CheckoutDialog
        token={token ?? ''}
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onCheckout={handleCheckout}

        onEnviarComprovante={handleEnviarComprovante} />
    </div>
  )
}
