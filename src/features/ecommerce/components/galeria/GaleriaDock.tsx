import { Check, Download, Heart, ShoppingBag } from 'lucide-react'
import type { FaseGaleria, FotoEnsaio, ModoGaleria } from '../../types/ecommerce.types'
import { cn } from '@/shared/lib/cn'

interface GaleriaDockProps {
  modo: ModoGaleria
  fase: FaseGaleria
  selectedCount: number
  pacoteLimit: number
  favoritosCount: number
  carrinhoCount: number
  totalExtras: number
  selectedFotos: FotoEnsaio[]
  downloadableCount: number
  hasSelectionChanges: boolean
  podeComprar: boolean
  isSaving: boolean
  isSending: boolean
  onSave: () => void
  onEnviar: () => void
  onOpenCart: () => void
  onCheckout: () => void
  onDownloadZip: () => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function GaleriaDock({
  modo,
  fase,
  selectedCount,
  pacoteLimit,
  favoritosCount,
  carrinhoCount,
  totalExtras,
  selectedFotos,
  downloadableCount,
  hasSelectionChanges,
  podeComprar,
  isSaving,
  isSending,
  onSave,
  onEnviar,
  onOpenCart,
  onCheckout,
  onDownloadZip,
}: GaleriaDockProps) {
  const percentual = pacoteLimit > 0 ? Math.min(100, Math.round((selectedCount / pacoteLimit) * 100)) : 0
  const emSelecao = modo !== 'DIRETO' && fase === 'SELECAO'
  const emEdicao = modo === 'COM_EDICAO' && (fase === 'SELECAO_ENVIADA' || fase === 'EM_EDICAO')
  const emAprovacao = modo === 'SEM_EDICAO' && fase === 'SELECAO_ENVIADA'
  const emComercializacao = modo !== 'DIRETO' && fase === 'COMERCIALIZACAO'
  const thumbs = selectedFotos.slice(-4)

  const secundario = 'flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-gallery-line bg-gallery-surface px-4 text-xs font-medium text-gallery-ink transition-colors hover:bg-gallery-line/40 disabled:opacity-50'
  const primario = 'flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gallery-ink px-5 text-xs font-semibold text-gallery-bg transition-opacity hover:opacity-90 disabled:opacity-50'

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gallery-line bg-gallery-bg/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))] pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-1.5 text-xs text-gallery-muted">
            <Heart className="h-3.5 w-3.5 text-gallery-accent" fill={favoritosCount > 0 ? 'currentColor' : 'none'} />
            <span className="tabular-nums">{favoritosCount}</span>
          </div>

          <div className="hidden h-7 w-px bg-gallery-line sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-medium text-gallery-ink">
              <Check className="h-3.5 w-3.5 text-gallery-accent" />
              <span className="truncate">
                {selectedCount} de {pacoteLimit} no pacote
              </span>
            </div>
            <div className="mt-1 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-gallery-line">
              <div className="h-full rounded-full bg-gallery-accent transition-all duration-500" style={{ width: `${percentual}%` }} />
            </div>
          </div>

          {thumbs.length > 0 && (
            <div className="hidden items-center pl-1 sm:flex">
              {thumbs.map((foto, index) => (
                <img
                  key={foto.id}
                  src={foto.thumbUrl}
                  alt=""
                  className={cn(
                    'h-8 w-8 rounded-[2px] border border-gallery-bg object-cover',
                    index > 0 && '-ml-2',
                  )}
                />
              ))}
            </div>
          )}

          {carrinhoCount > 0 && (
            <button
              onClick={onOpenCart}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-gallery-line bg-gallery-surface px-3 py-2 text-[11px] font-medium text-gallery-ink sm:hidden"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              {carrinhoCount} · {formatBRL(totalExtras)}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {emSelecao && hasSelectionChanges && (
            <button onClick={onSave} disabled={isSaving} className={cn(secundario, 'flex-1 sm:flex-none')}>
              {isSaving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
          )}

          {emSelecao && (
            <button onClick={onEnviar} disabled={isSending || selectedCount === 0} className={cn(primario, 'flex-1 sm:flex-none')}>
              {isSending ? 'Enviando...' : `Enviar seleção${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
            </button>
          )}

          {downloadableCount > 0 && (
            <button onClick={onDownloadZip} className={cn(secundario, 'flex-1 sm:flex-none')}>
              <Download className="h-3.5 w-3.5" />
              Baixar pacote ({downloadableCount})
            </button>
          )}

          {(emEdicao || emAprovacao) && carrinhoCount > 0 && (
            <button onClick={onOpenCart} className={cn(secundario, 'hidden sm:flex')}>
              <ShoppingBag className="h-3.5 w-3.5" />
              Carrinho ({carrinhoCount}) · {formatBRL(totalExtras)}
            </button>
          )}

          {emComercializacao && carrinhoCount > 0 && podeComprar && (
            <>
              <button onClick={onOpenCart} className={cn(secundario, 'hidden sm:flex')}>
                <ShoppingBag className="h-3.5 w-3.5" />
                Carrinho ({carrinhoCount})
              </button>
              <button onClick={onCheckout} className={cn(primario, 'flex-1 sm:flex-none')}>
                Finalizar · {formatBRL(totalExtras)}
              </button>
            </>
          )}

          {modo === 'DIRETO' && hasSelectionChanges && (
            <button onClick={onSave} disabled={isSaving} className={cn(secundario, 'flex-1 sm:flex-none')}>
              {isSaving ? 'Salvando...' : 'Salvar seleção'}
            </button>
          )}

          {modo === 'DIRETO' && podeComprar && carrinhoCount > 0 && (
            <button onClick={onCheckout} className={cn(primario, 'flex-1 sm:flex-none')}>
              Finalizar ({carrinhoCount}) · {formatBRL(totalExtras)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
