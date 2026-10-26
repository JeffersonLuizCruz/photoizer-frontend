import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, X, Check, Clock, ShoppingCart, Loader2, MessageCircle, Send, User, Heart } from 'lucide-react'
import { toast } from 'sonner'
import type { FaseGaleria, FotoEnsaio, FotoComentario, ModoGaleria } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
import { numeroGaleriaLabel } from '@/shared/lib/foto'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { extractErrorMessage } from '@/shared/api'

interface FotoViewerProps {
  fotos: FotoEnsaio[]
  currentIndex: number
  onClose: () => void
  onToggleSelect: (fotoId: string) => void
  onNavigate: (index: number) => void
  selectedIds: Set<string>
  carrinhoIds: Set<string>
  pacoteLimit: number
  selectedCount: number
  onToggleCarrinho: (fotoId: string) => void
  valorUnitario: number
  cartLoadingIds: Set<string>
  token: string
  commentsOpen: boolean
  onCommentsOpenChange: (open: boolean) => void
  favoritoIds: Set<string>
  onToggleFavorito: (fotoId: string) => void
  podeSelecionar: boolean
  podeComprar: boolean
  podeBaixar: boolean
  extrasEmSelecao: boolean
  valoresExtras: Record<string, number>
  modoGaleria: ModoGaleria
  faseGaleria: FaseGaleria
  requerEdicao: boolean
}

function formatComentarioData(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return format(d, "dd/MM 'às' HH:mm")
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function ComentarioBubble({ comentario }: { comentario: FotoComentario }) {
  const isStaff = comentario.origem === 'STAFF'
  const autor = comentario.autorNome?.trim() || (isStaff ? 'Estúdio Photoizer' : 'Cliente')

  return (
    <div className={cn('flex max-w-[85%] flex-col', isStaff ? 'ml-auto items-end' : 'mr-auto items-start')}>
      <span className={cn('mb-0.5 px-1 text-[10px] font-medium', isStaff ? 'text-gallery-accent' : 'text-gallery-muted')}>
        {autor} <span className="text-gallery-muted/70">· {formatComentarioData(comentario.createdAt)}</span>
      </span>
      <div className={cn(
        'break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
        isStaff ? 'rounded-br-sm bg-gallery-accent text-white' : 'rounded-bl-sm bg-gallery-bg text-gallery-ink ring-1 ring-gallery-line',
      )}>
        {isStaff && (
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/80">
            <MessageCircle className="h-3 w-3" /> Resposta do estúdio
          </span>
        )}
        {comentario.mensagem}
      </div>
    </div>
  )
}

export function FotoViewer({
  fotos, currentIndex, onClose, onToggleSelect, onNavigate,
  selectedIds, carrinhoIds, pacoteLimit, selectedCount, onToggleCarrinho, valorUnitario, cartLoadingIds,
  token, commentsOpen, onCommentsOpenChange, favoritoIds, onToggleFavorito,
  podeSelecionar, podeComprar, podeBaixar, extrasEmSelecao, valoresExtras,
  modoGaleria, faseGaleria, requerEdicao,
}: FotoViewerProps) {
  const foto = fotos[currentIndex]
  const isSelected = selectedIds.has(foto.id)
  const isInCart = carrinhoIds.has(foto.id)
  const isFavorito = favoritoIds.has(foto.id)
  const isLoading = cartLoadingIds.has(foto.id)
  const pendente = !!foto.compraExtraId && foto.status !== 'PAGA'
  const packageFull = selectedCount >= pacoteLimit
  const valor = valoresExtras[foto.id] ?? valorUnitario
  const fotoSeraEditada = modoGaleria === 'COM_EDICAO'
    && faseGaleria === 'COMERCIALIZACAO'
    && !foto.selecionadaPacote
    && !foto.compraExtraId
    && foto.versaoAtual !== 'EDITADA'

  // Comentários
  const [comentarios, setComentarios] = useState<FotoComentario[]>([])
  const [carregandoComentarios, setCarregandoComentarios] = useState(false)
  const [comentarioTexto, setComentarioTexto] = useState('')
  const [autorNome, setAutorNome] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentsOpen) onCommentsOpenChange(false)
        else onClose()
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0 && !commentsOpen) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < fotos.length - 1 && !commentsOpen) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentIndex, fotos.length, onClose, onNavigate, commentsOpen, onCommentsOpenChange])

  useEffect(() => {
    setComentarios([])
    if (!commentsOpen || !token) return
    let ativo = true
    setCarregandoComentarios(true)
    ecommerceService.listarComentarios(token, foto.id)
      .then((data) => { if (ativo) setComentarios(data) })
      .catch(() => { if (ativo) setComentarios([]) })
      .finally(() => { if (ativo) setCarregandoComentarios(false) })
    return () => { ativo = false }
  }, [commentsOpen, token, foto.id])

  const enviarComentario = async () => {
    const texto = comentarioTexto.trim()
    if (!texto || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      const novo = await ecommerceService.comentarFoto(token, foto.id, {
        mensagem: texto,
        autorNome: autorNome.trim() || undefined,
      })
      setComentarios((prev) => [...prev, novo])
      setComentarioTexto('')
      toast.success('Comentário enviado!')
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar comentário'))
    } finally {
      setEnviandoComentario(false)
    }
  }

  const controlBtn = 'flex items-center justify-center rounded-full bg-gallery-surface/90 text-gallery-ink shadow-md ring-1 ring-gallery-line backdrop-blur transition-all hover:bg-gallery-surface active:scale-95'

  // Impede que a página atrás do visualizador role no mobile.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = anterior }
  }, [])

  const toqueRef = useRef<{ x: number; y: number } | null>(null)

  const iniciarToque = (e: TouchEvent<HTMLDivElement>) => {
    if (commentsOpen || e.touches.length !== 1) return
    toqueRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const encerrarToque = (e: TouchEvent<HTMLDivElement>) => {
    const inicio = toqueRef.current
    toqueRef.current = null
    if (!inicio || commentsOpen) return
    const toque = e.changedTouches[0]
    if (!toque) return
    const dx = toque.clientX - inicio.x
    const dy = toque.clientY - inicio.y
    // Exige deslocamento horizontal claro para não conflitar com toques na vertical.
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (dx < 0 && currentIndex < fotos.length - 1) {
      onCommentsOpenChange(false)
      onNavigate(currentIndex + 1)
    } else if (dx > 0 && currentIndex > 0) {
      onCommentsOpenChange(false)
      onNavigate(currentIndex - 1)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex flex-col bg-gallery-ink/95 backdrop-blur"
      role="dialog" aria-modal="true" aria-label={`Visualizar ${foto.fileName}`}>
      {/* Topo */}
      <div className="flex shrink-0 items-start justify-between gap-2 px-3 pb-1 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4">
        <div className="min-w-0 flex-1 pt-1">
          <p className="truncate text-sm font-semibold tracking-wide text-gallery-bg/90">
            {foto.numeroGaleria != null
              ? (foto.titulo ? `${numeroGaleriaLabel(foto.numeroGaleria)} · ${foto.titulo}` : numeroGaleriaLabel(foto.numeroGaleria))
              : (foto.titulo || foto.fileName)}
          </p>
          <p className="text-[11px] font-medium tracking-wide text-gallery-bg/55">
            {currentIndex + 1} / {fotos.length}
          </p>
        </div>
        <button onClick={onClose} aria-label="Fechar visualização"
          className={cn('h-11 w-11 shrink-0', controlBtn)}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Imagem */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-1 sm:px-6"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={iniciarToque}
        onTouchEnd={encerrarToque}>
        <div
          role="img"
          aria-label={foto.fileName}
          className="pointer-events-none h-full w-full select-none bg-contain bg-center bg-no-repeat [-webkit-touch-callout:none]"
          style={{ backgroundImage: `url("${foto.watermarkedUrl}")` }}
          onContextMenu={(e) => e.preventDefault()}
        />
        {/* Overlay: dificulta salvar imagem / menu de toque longo. */}
        <div
          className="absolute inset-0 select-none [-webkit-touch-callout:none]"
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()}
        />

        {currentIndex > 0 && (
          <button onClick={() => onNavigate(currentIndex - 1)}
            aria-label="Foto anterior"
            className={cn('absolute left-2 top-1/2 h-11 w-11 -translate-y-1/2 sm:left-4', controlBtn)}>
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {currentIndex < fotos.length - 1 && !commentsOpen && (
          <button onClick={() => onNavigate(currentIndex + 1)}
            aria-label="Próxima foto"
            className={cn('absolute right-2 top-1/2 h-11 w-11 -translate-y-1/2 sm:right-4', controlBtn)}>
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {foto.titulo && (
          <span className="pointer-events-none absolute left-1/2 top-2 hidden max-w-xs -translate-x-1/2 truncate rounded-full bg-gallery-surface/85 px-3 py-1.5 text-[12px] text-gallery-ink shadow ring-1 ring-gallery-line backdrop-blur sm:block">
            {foto.titulo}
          </span>
        )}
      </div>

      {/* Ações fixas no rodapé */}
      <div className="shrink-0 border-t border-gallery-line bg-gallery-surface/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => onCommentsOpenChange(!commentsOpen)}
              aria-pressed={commentsOpen}
              className={cn(
                'flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium shadow-md transition-all active:scale-95 sm:flex-none',
                commentsOpen
                  ? 'bg-gallery-ink text-gallery-bg shadow-gallery-ink/20'
                  : 'bg-gallery-surface text-gallery-ink ring-1 ring-gallery-line hover:bg-gallery-bg',
              )}>
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{comentarios.length > 0 ? `Comentários (${comentarios.length})` : 'Comentar'}</span>
            </button>
            <button onClick={() => onToggleFavorito(foto.id)}
              aria-pressed={isFavorito}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full px-0 text-sm font-medium shadow-md transition-all active:scale-95 sm:w-auto sm:px-4',
                isFavorito
                  ? 'bg-gallery-accent text-white shadow-gallery-accent/30'
                  : 'bg-gallery-surface text-gallery-accent ring-1 ring-gallery-line hover:bg-gallery-bg',
              )}>
              <Heart className="h-4 w-4 shrink-0" fill={isFavorito ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">Gostei</span>
            </button>
          </div>

          {pendente ? (
            <button disabled
              className="flex min-h-12 w-full cursor-default items-center justify-center gap-2 rounded-2xl bg-gallery-line px-5 py-3 text-sm font-medium text-gallery-ink shadow-md">
              <Clock className="h-4 w-4" />
              Aguardando confirmação
            </button>
          ) : isSelected ? (
            foto.downloadada ? (
              podeBaixar ? (
                <a href={ecommerceService.downloadUrl(token, foto.id)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-ink px-5 py-3 text-sm font-medium text-gallery-bg shadow-md shadow-gallery-ink/20 transition-opacity hover:opacity-90 active:scale-[0.99]">
                  <Check className="h-4 w-4" />
                  Baixada · baixar novamente
                </a>
              ) : (
                <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-line px-5 py-3 text-sm font-medium text-gallery-ink shadow-md">
                  <Check className="h-4 w-4" />
                  Baixada
                </span>
              )
            ) : podeSelecionar ? (
              <button onClick={() => onToggleSelect(foto.id)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-accent px-5 py-3 text-sm font-medium text-white shadow-md shadow-gallery-accent/30 transition-opacity hover:opacity-90 active:scale-[0.99]">
                <Check className="h-4 w-4" />
                Remover do pacote
              </button>
            ) : podeBaixar ? (
              <a href={ecommerceService.downloadUrl(token, foto.id)}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-ink px-5 py-3 text-sm font-medium text-gallery-bg shadow-md shadow-gallery-ink/20 transition-opacity hover:opacity-90 active:scale-[0.99]">
                <Check className="h-4 w-4" />
                Baixar foto
              </a>
            ) : (
              <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-line px-5 py-3 text-sm font-medium text-gallery-ink shadow-md">
                <Check className="h-4 w-4" />
                Selecionada
              </span>
            )
          ) : isInCart ? (
            podeComprar ? (
              <button onClick={() => onToggleCarrinho(foto.id)} disabled={isLoading}
                className={cn(
                  'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-md transition-all active:scale-[0.99]',
                  isLoading ? 'bg-gallery-line text-gallery-muted'
                    : 'bg-gallery-accent text-white shadow-gallery-accent/30 hover:opacity-90',
                )}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {isLoading ? 'Removendo...' : 'Remover do carrinho'}
              </button>
            ) : (
              <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-line px-5 py-3 text-sm font-medium text-gallery-ink shadow-md">
                <ShoppingCart className="h-4 w-4" />
                {extrasEmSelecao ? 'Extra na seleção' : 'No carrinho'}
              </span>
            )
          ) : (!packageFull && podeSelecionar) ? (
            <button onClick={() => onToggleSelect(foto.id)} disabled={isLoading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-surface px-5 py-3 text-sm font-medium text-gallery-ink shadow-md ring-1 ring-gallery-line transition-colors hover:bg-gallery-bg active:scale-[0.99] disabled:opacity-40">
              <Check className="h-4 w-4" />
              Incluir no pacote
            </button>
          ) : podeComprar ? (
            <button onClick={() => onToggleCarrinho(foto.id)} disabled={isLoading}
              className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-md transition-all active:scale-[0.99]',
                isLoading ? 'bg-gallery-line text-gallery-muted'
                  : 'bg-gallery-accent text-white hover:opacity-90',
              )}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {isLoading
                ? 'Adicionando...'
                : extrasEmSelecao
                  ? 'Incluir extra'
                  : fotoSeraEditada
                    ? `Comprar e editar ${formatBRL(valor)}`
                    : `Comprar ${formatBRL(valor)}`}
            </button>
          ) : (
            <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gallery-line px-5 py-3 text-sm font-medium text-gallery-muted shadow-md">
              {requerEdicao ? 'Aguardando edição' : 'Aguardando aprovação'}
            </span>
          )}
        </div>
      </div>
    </div>

      {/* Painel de comentários */}
      <Sheet open={commentsOpen} onOpenChange={onCommentsOpenChange}>
        <SheetContent
          hideClose
          className="h-dvh max-h-none w-full gap-0 overflow-hidden border-l border-gallery-line bg-gallery-surface/95 p-0 backdrop-blur-xl sm:h-full sm:w-[360px] sm:max-w-[360px]"
        >
          <div className="flex items-center justify-between border-b border-gallery-line px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <SheetTitle className="flex items-center gap-2 font-display text-sm font-semibold text-gallery-ink">
              <User className="h-4 w-4 text-gallery-accent" />
              Comentários da foto
            </SheetTitle>
            <button onClick={() => onCommentsOpenChange(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gallery-bg text-gallery-ink ring-1 ring-gallery-line transition-colors hover:bg-gallery-line/40"
              aria-label="Fechar comentários">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {carregandoComentarios ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-gallery-accent" />
              </div>
            ) : comentarios.length === 0 ? (
              <div className="py-10 text-center">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gallery-muted/60" />
                <p className="text-sm text-gallery-muted">Nenhum comentário ainda.</p>
                <p className="mt-1 text-xs text-gallery-muted/80">
                  Deixe sua sugestão ou pedido sobre esta foto.
                </p>
              </div>
            ) : (
              comentarios.map((c) => <ComentarioBubble key={c.id} comentario={c} />)
            )}
          </div>

          <div className="space-y-2.5 border-t border-gallery-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <input
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              maxLength={120}
              placeholder="Seu nome (opcional)"
              className="w-full rounded-xl bg-gallery-bg px-3.5 py-2.5 text-[13px] text-gallery-ink outline-none ring-1 ring-gallery-line transition-shadow placeholder:text-gallery-muted/70 focus:ring-2 focus:ring-gallery-accent"
            />
            <textarea
              value={comentarioTexto}
              onChange={(e) => setComentarioTexto(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ex.: Poderia melhorar a edição do meu corpo nessa foto?"
              className="w-full resize-none rounded-xl bg-gallery-bg px-3.5 py-2.5 text-[13px] text-gallery-ink outline-none ring-1 ring-gallery-line transition-shadow placeholder:text-gallery-muted/70 focus:ring-2 focus:ring-gallery-accent"
            />
            <button onClick={enviarComentario} disabled={enviandoComentario || !comentarioTexto.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gallery-ink py-2.5 text-sm font-semibold text-gallery-bg transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {enviandoComentario ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar comentário
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
