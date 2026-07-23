import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldAlert, Camera, Loader2, ShoppingCart, Download, Search, Filter, X, Heart, Columns2 } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { FotoEnsaio, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import type { GaleriaResponse } from '../services/ecommerce.service'
import { FotoViewer } from '../components/FotoViewer'
import { PhotoGrid } from '../components/PhotoGrid'
import { CheckoutDialog } from '../components/CheckoutDialog'
import { PurchaseConfirmation } from '../components/PurchaseConfirmation'
import { MinhasComprasSection } from '../components/MinhasComprasSection'
import { ComparadorFotos } from '../components/ComparadorFotos'
import { CartSummaryPanel } from '../components/CartSummaryPanel'
import { DepoimentosSection } from '../components/DepoimentosSection'

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
  const [isSaving, setIsSaving] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [compraFinalizada, setCompraFinalizada] = useState<CompraExtraResponse | null>(null)
  const [comprovanteEnviado, setComprovanteEnviado] = useState(false)

  // Wishlist, comparação e carrinho lateral
  const [favoritoIds, setFavoritoIds] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCart, setShowCart] = useState(false)
  const [showComparador, setShowComparador] = useState(false)

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
      .catch(() => setError('Galeria não encontrada ou não publicada'))
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

  const toggleSelect = useCallback((fotoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(fotoId)) next.delete(fotoId)
      else next.add(fotoId)
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

  const handleSaveSelection = async () => {
    if (!token) return
    setIsSaving(true)
    try {
      const selected = Array.from(selectedIds)
      const deselected = fotos.filter((f) => f.selecionadaPacote && !selectedIds.has(f.id)).map((f) => f.id)
      if (selected.length > 0) {
        const result = await ecommerceService.selecionar(token, selected, true)
        setGaleria((prev) => prev ? { ...prev, fotos: prev.fotos.map((f) => result.find((r) => r.id === f.id) ?? f) } : prev)
      }
      if (deselected.length > 0) {
        const result = await ecommerceService.selecionar(token, deselected, false)
        setGaleria((prev) => prev ? { ...prev, fotos: prev.fotos.map((f) => result.find((r) => r.id === f.id) ?? f) } : prev)
      }
      toast.success('Seleção salva!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar seleção')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCheckout = async (metodoPagamento: MetodoPagamento | null) => {
    if (!token || carrinhoCount === 0) return
    setIsSubmitting(true)
    try {
      const compra = await ecommerceService.checkout(token, metodoPagamento ?? undefined)
      const enviouComp = !!comprovante
      if (comprovante) {
        await ecommerceService.uploadComprovante(token, compra.id, comprovante)
      }
      setCompraFinalizada(compra)
      setComprovanteEnviado(enviouComp)
      setShowCheckout(false)
      setGaleria((prev) => prev ? {
        ...prev,
        fotos: prev.fotos.map((f) => carrinhoIds.has(f.id) ? { ...f, compraExtraId: compra.id, status: enviouComp ? 'AGUARDANDO_CONFIRMACAO' as const : 'AGUARDANDO_COMPROVANTE' as const } : f)
      } : prev)
      setCarrinhoIds(new Set())
      setCarrinhoCount(0)
      setComprovante(null)
      toast.success('Compra finalizada!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao finalizar compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasSelectionChanges = fotos.some((f) => f.selecionadaPacote !== selectedIds.has(f.id))
  const totalExtras = carrinhoCount * valorUnitario

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando galeria...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Galeria não disponível</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (fotos.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <Camera className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Nenhuma foto publicada</h1>
          <p className="text-sm text-muted-foreground">As fotos ainda não foram publicadas. Volte mais tarde.</p>
        </div>
      </div>
    )
  }

  if (compraFinalizada) {
    return (
      <PurchaseConfirmation
        compra={compraFinalizada}
        token={token ?? ''}
        comprovanteEnviado={comprovanteEnviado}
        onVoltar={() => setCompraFinalizada(null)} />
    )
  }

  return (
    <div className="min-h-screen bg-background" onContextMenu={(e) => e.preventDefault()}>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div>
            <h1 className="text-sm font-semibold">{galeria?.pacoteNome || 'Sua Galeria de Fotos'}</h1>
            <p className="text-[11px] text-muted-foreground">
              {selectedIds.size} de {pacoteLimit} no pacote
              {carrinhoCount > 0 && ` · ${carrinhoCount} extra(s): R$ ${totalExtras.toFixed(2)}`}
              {filteredFotos.length < fotos.length && ` · ${filteredFotos.length} exibidas`}
              {galeria?.localEnsaio && ` · ${galeria.localEnsaio}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {favoritoIds.size > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground" title="Fotos favoritas">
                <Heart className="h-3.5 w-3.5 text-red-500" fill="currentColor" />
                {favoritoIds.size}
              </span>
            )}
            <button onClick={() => setCompareMode((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                compareMode ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'hover:bg-accent'
              }`}>
              <Columns2 className="h-3.5 w-3.5" />
              Comparar
            </button>
            {compareMode && compareIds.size >= 2 && (
              <button onClick={() => setShowComparador(true)}
                className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors">
                Ver comparação ({compareIds.size})
              </button>
            )}
            <button onClick={() => setShowCart(true)}
              className="relative rounded-lg border p-1.5 hover:bg-accent transition-colors" title="Meu carrinho">
              <ShoppingCart className="h-4 w-4" />
              {carrinhoCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-blue-600 text-white text-[10px] font-medium flex items-center justify-center">
                  {carrinhoCount}
                </span>
              )}
            </button>
            {hasSelectionChanges && (
              <button onClick={handleSaveSelection} disabled={isSaving}
                className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isSaving ? 'Salvando...' : 'Salvar Seleção'}
              </button>
            )}
            {downloadableFotos.length > 0 && (
              <a href={ecommerceService.downloadZipUrl(token ?? '')}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                <Download className="h-3.5 w-3.5" />
                ZIP ({downloadableFotos.length})
              </a>
            )}
            {carrinhoCount > 0 && (
              <button onClick={() => setShowCheckout(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700 transition-colors">
                <ShoppingCart className="h-3.5 w-3.5" />
                Finalizar ({carrinhoCount})
              </button>
            )}
          </div>
        </div>
        {/* Barra de filtros */}
        <div className="px-4 md:px-6 pb-3 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tags ou nome..."
              className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {categorias.length > 0 && (
            <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium">
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          {(categoriaFilter || searchTerm) && (
            <button onClick={() => { setCategoriaFilter(''); setSearchTerm('') }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </header>

      {/* Barra de progresso do pacote */}
      <div className="px-4 md:px-6 pt-4 pb-1">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold">
                Fotos no pacote: {selectedIds.size} de {pacoteLimit}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedIds.size >= pacoteLimit
                  ? 'Limite do pacote atingido'
                  : `Você pode selecionar mais ${pacoteLimit - selectedIds.size} foto(s)`}
                {carrinhoCount > 0 && ` · Carrinho: ${carrinhoCount} extra(s) · R$ ${(carrinhoCount * valorUnitario).toFixed(2)}`}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {pacoteLimit > 0 ? Math.round((selectedIds.size / pacoteLimit) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((selectedIds.size / pacoteLimit) * 100, 100)}%`,
                background: selectedIds.size >= pacoteLimit
                  ? 'linear-gradient(to right, #f59e0b, #ef4444)'
                  : 'linear-gradient(to right, #10b981, #059669)'
              }}
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
            if (originalIndex >= 0) setViewerIndex(originalIndex)
          }} />

        {token && <MinhasComprasSection token={token} />}

        <div className="border-t pt-6">
          <DepoimentosSection />
        </div>
      </div>

      {viewerIndex !== null && (
        <FotoViewer fotos={fotos} currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)} onToggleSelect={toggleSelect}
          onNavigate={(i) => setViewerIndex(i)} selectedIds={selectedIds}
          carrinhoIds={carrinhoIds} pacoteLimit={pacoteLimit}
          selectedCount={selectedIds.size} onToggleCarrinho={toggleCarrinho}
          valorUnitario={valorUnitario} cartLoadingIds={cartLoadingIds} />
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

      <CheckoutDialog
        token={token ?? ''}
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
        isSubmitting={isSubmitting}
        comprovante={comprovante}
        onComprovanteChange={setComprovante} />
    </div>
  )
}
