import { Check, Download, Heart, ShoppingBag } from 'lucide-react'
import type { FaseGaleria, FotoEnsaio, ModoGaleria } from '../../types/ecommerce.types'
import { ecommerceService } from '../../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
import { numeroGaleriaLabel } from '@/shared/lib/foto'

interface GaleriaGridProps {
  fotos: FotoEnsaio[]
  token: string
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  cartLoadingIds: Set<string>
  favoritoIds: Set<string>
  compareIds: Set<string>
  compareMode: boolean
  modoGaleria: ModoGaleria
  faseGaleria: FaseGaleria
  podeSelecionar: boolean
  podeComprar: boolean
  podeBaixar: boolean
  extrasEmSelecao: boolean
  onSelect: (fotoId: string) => void
  onToggleCarrinho: (fotoId: string) => void
  onToggleFavorito: (fotoId: string) => void
  onToggleCompare: (fotoId: string) => void
  onView: (index: number) => void
}

export function GaleriaGrid({
  fotos,
  token,
  selectedIds,
  carrinhoIds,
  pacoteLimit,
  cartLoadingIds,
  favoritoIds,
  compareIds,
  compareMode,
  modoGaleria,
  faseGaleria,
  podeSelecionar,
  podeComprar,
  podeBaixar,
  extrasEmSelecao,
  onSelect,
  onToggleCarrinho,
  onToggleFavorito,
  onToggleCompare,
  onView,
}: GaleriaGridProps) {
  const packageFull = selectedIds.size >= pacoteLimit

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {fotos.map((foto, index) => {
        const isSelected = selectedIds.has(foto.id)
        const isInCart = carrinhoIds.has(foto.id)
        const isFavorito = favoritoIds.has(foto.id)
        const isComparing = compareIds.has(foto.id)
        const isCartLoading = cartLoadingIds.has(foto.id)
        const pendente = !!foto.compraExtraId && foto.status !== 'PAGA'
        const jaComprada = foto.status === 'PAGA'
        const podeBaixarEsta = podeBaixar
          && (foto.selecionadaPacote || jaComprada)
          && (modoGaleria !== 'COM_EDICAO' || foto.versaoAtual === 'EDITADA')
        // Foto restante da galeria COM_EDICAO: pode ser comprada, mas o
        // estúdio edita sob demanda antes de liberar o download.
        const fotoSeraEditada = modoGaleria === 'COM_EDICAO'
          && faseGaleria === 'COMERCIALIZACAO'
          && !foto.selecionadaPacote
          && !foto.compraExtraId
          && foto.versaoAtual !== 'EDITADA'
        const numero = foto.numeroGaleria != null ? numeroGaleriaLabel(foto.numeroGaleria) : null
        // Uma acao por foto, na mesma ordem do fluxo antigo: pacote primeiro,
        // extra quando o pacote ja esta cheio (ou quando a selecao esta fechada).
        const mostrarCheck = podeSelecionar && !jaComprada && !pendente && !foto.compraExtraId
          && (isSelected || (!isInCart && !packageFull))
        const mostrarSacola = podeComprar && !isSelected && !foto.selecionadaPacote
          && !jaComprada && !pendente && !foto.compraExtraId
          && (isInCart || packageFull || !podeSelecionar)

        const abrirFoto = () => {
          if (compareMode) onToggleCompare(foto.id)
          else onView(index)
        }

        return (
          <figure
            key={foto.id}
            className="group relative min-w-0 motion-safe:animate-[gallery-fade-up_0.6s_ease-out_both]"
            style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={abrirFoto}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  abrirFoto()
                }
              }}
              aria-label={compareMode ? `Comparar ${foto.fileName}` : `Ver ${foto.fileName}`}
              className={cn(
                'relative block aspect-[3/2] w-full cursor-pointer overflow-hidden rounded-[2px] bg-gallery-line/40 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-gallery-accent',
                isSelected && 'ring-2 ring-gallery-accent ring-offset-2 ring-offset-gallery-bg',
                compareMode && isComparing && 'ring-2 ring-gallery-ink ring-offset-2 ring-offset-gallery-bg',
              )}
            >
              <img
                src={foto.thumbUrl}
                alt={foto.fileName}
                loading="lazy"
                decoding="async"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="pointer-events-none block h-full w-full select-none object-cover transition-transform duration-500 ease-out [-webkit-touch-callout:none] motion-safe:group-hover:scale-[1.02]"
              />

              {numero && (
                <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-sm bg-gallery-ink/55 px-1.5 py-0.5 text-[9px] font-medium tabular-nums tracking-wider text-white backdrop-blur">
                  {numero}
                </span>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorito(foto.id) }}
                className={cn(
                  'absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 backdrop-blur transition-all sm:h-10 sm:w-10',
                  isFavorito
                    ? 'bg-gallery-accent text-white ring-gallery-accent/40'
                    : 'bg-gallery-surface/85 text-gallery-ink ring-gallery-line hover:bg-gallery-surface',
                )}
                aria-label={isFavorito ? `Remover ${foto.fileName} do Gostei` : `Marcar ${foto.fileName} como Gostei`}
                aria-pressed={isFavorito}
              >
                <Heart className="h-4 w-4" fill={isFavorito ? 'currentColor' : 'none'} />
              </button>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-gallery-ink/55 via-gallery-ink/10 to-transparent p-1.5 pt-8">
                {(jaComprada || pendente || isInCart || isSelected || fotoSeraEditada) && (
                  <span className="rounded-sm bg-gallery-surface/90 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-gallery-ink backdrop-blur">
                    {jaComprada ? 'Adquirida'
                      : pendente ? 'Aguardando'
                        : isSelected ? 'Pacote'
                          : fotoSeraEditada ? 'A editar'
                            : 'Extra'}
                  </span>
                )}

                <div className="pointer-events-auto">
                  {mostrarCheck && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(foto.id) }}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 backdrop-blur transition-all sm:h-10 sm:w-10',
                        isSelected
                          ? 'bg-gallery-accent text-white ring-gallery-accent/40'
                          : 'bg-gallery-surface/85 text-gallery-ink ring-gallery-line hover:bg-gallery-surface',
                      )}
                      aria-label={isSelected ? `Remover ${foto.fileName} do pacote` : `Incluir ${foto.fileName} no pacote`}
                      aria-pressed={isSelected}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  {mostrarSacola && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCarrinho(foto.id) }}
                      disabled={isCartLoading || (isInCart && extrasEmSelecao && foto.temVersaoEditada)}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 backdrop-blur transition-all disabled:opacity-50 sm:h-10 sm:w-10',
                        isInCart
                          ? 'bg-gallery-ink text-gallery-bg ring-gallery-ink/30'
                          : 'bg-gallery-surface/85 text-gallery-ink ring-gallery-line hover:bg-gallery-surface',
                      )}
                      aria-label={isInCart
                        ? `Remover ${foto.fileName} do carrinho`
                        : `${extrasEmSelecao ? 'Incluir' : 'Comprar'} ${foto.fileName} como extra`}
                      title={isInCart
                        ? (extrasEmSelecao && foto.temVersaoEditada
                          ? 'Foto já editada: fale com o estúdio'
                          : 'Remover do carrinho')
                        : extrasEmSelecao
                          ? 'Incluir extra'
                          : fotoSeraEditada
                            ? 'Comprar foto (editada após a compra)'
                            : 'Comprar foto'}
                      aria-pressed={isInCart}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  )}

                  {!podeSelecionar && podeBaixarEsta && (
                    <a
                      href={ecommerceService.downloadUrl(token, foto.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-gallery-surface/85 text-gallery-ink shadow-sm ring-1 ring-gallery-line backdrop-blur transition-colors hover:bg-gallery-surface sm:h-10 sm:w-10"
                      aria-label={`Baixar ${foto.fileName}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </figure>
        )
      })}
    </div>
  )
}
