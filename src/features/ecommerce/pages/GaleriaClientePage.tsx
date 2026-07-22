import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldAlert, Camera, Loader2, ShoppingCart, Download } from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '../services/ecommerce.service'
import type { FotoEnsaio, CompraExtraResponse, MetodoPagamento } from '../types/ecommerce.types'
import type { GaleriaResponse } from '../services/ecommerce.service'
import { FotoViewer } from '../components/FotoViewer'
import { PhotoGrid } from '../components/PhotoGrid'
import { CheckoutDialog } from '../components/CheckoutDialog'
import { PurchaseConfirmation } from '../components/PurchaseConfirmation'
import { MinhasComprasSection } from '../components/MinhasComprasSection'

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

  const fotos = galeria?.fotos ?? []
  const pacoteLimit = galeria?.pacoteQuantidadeFotos ?? 0
  const valorUnitario = galeria?.valorUnitarioFotoExtra ?? 15
  const isDownloadable = (foto: FotoEnsaio) => foto.selecionadaPacote || foto.status === 'PAGA'
  const downloadableFotos = fotos.filter(isDownloadable)

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
  }, [token, isLoading, error])

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
            <h1 className="text-sm font-semibold">Sua Galeria de Fotos</h1>
            <p className="text-[11px] text-muted-foreground">
              {selectedIds.size} de {pacoteLimit} no pacote
              {carrinhoCount > 0 && ` · ${carrinhoCount} extra(s): R$ ${totalExtras.toFixed(2)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
      </header>

      <div className="px-4 md:px-6 py-6">
        <PhotoGrid
          fotos={fotos}
          token={token ?? ''}
          selectedIds={selectedIds}
          carrinhoIds={carrinhoIds}
          cartLoadingIds={cartLoadingIds}
          pacoteLimit={pacoteLimit}
          valorUnitario={valorUnitario}
          onSelect={toggleSelect}
          onToggleCarrinho={toggleCarrinho}
          onView={(index) => setViewerIndex(index)} />

        {token && <MinhasComprasSection token={token} />}
      </div>

      {viewerIndex !== null && (
        <FotoViewer fotos={fotos} currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)} onToggleSelect={toggleSelect}
          onNavigate={(i) => setViewerIndex(i)} selectedIds={selectedIds}
          carrinhoIds={carrinhoIds} pacoteLimit={pacoteLimit}
          selectedCount={selectedIds.size} onToggleCarrinho={toggleCarrinho}
          valorUnitario={valorUnitario} cartLoadingIds={cartLoadingIds} />
      )}

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
