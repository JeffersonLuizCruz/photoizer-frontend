import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, X, Check, Clock, ShoppingCart, Loader2, MessageCircle, Send, User, Heart } from 'lucide-react'
import { toast } from 'sonner'
import type { FotoEnsaio, FotoComentario } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'
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
}

function formatComentarioData(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return format(d, "dd/MM 'às' HH:mm")
}

function ComentarioBubble({ comentario }: { comentario: FotoComentario }) {
  const isStaff = comentario.origem === 'STAFF'
  const autor = comentario.autorNome?.trim() || (isStaff ? 'Estúdio Photoizer' : 'Cliente')

  return (
    <div className={cn('flex max-w-[85%] flex-col', isStaff ? 'ml-auto items-end' : 'mr-auto items-start')}>
      <span className={cn('mb-0.5 px-1 text-[10px] font-medium', isStaff ? 'text-cyan-600' : 'text-slate-400')}>
        {autor} <span className="text-slate-400">· {formatComentarioData(comentario.auditInfo.createdAt)}</span>
      </span>
      <div className={cn(
        'break-words rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
        isStaff ? 'rounded-br-sm bg-cyan-500 text-white' : 'rounded-bl-sm bg-sky-50 text-slate-700 ring-1 ring-cyan-100',
      )}>
        {isStaff && (
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-50">
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
}: FotoViewerProps) {
  const foto = fotos[currentIndex]
  const isSelected = selectedIds.has(foto.id)
  const isInCart = carrinhoIds.has(foto.id)
  const isFavorito = favoritoIds.has(foto.id)
  const isLoading = cartLoadingIds.has(foto.id)
  const pendente = !!foto.compraExtraId && foto.status !== 'PAGA'
  const packageFull = selectedCount >= pacoteLimit

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

  const controlBtn = 'flex items-center justify-center rounded-full bg-white/80 text-cyan-700 shadow-md ring-1 ring-cyan-100 backdrop-blur transition-all hover:scale-105 hover:bg-white active:scale-95'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-sky-100/95 via-amber-50/95 to-amber-50/95 backdrop-blur" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Fechar visualização"
        className={cn('absolute right-4 top-4 z-30 h-11 w-11', controlBtn)}>
        <X className="h-6 w-6" />
      </button>
      <span className="absolute left-4 top-5 z-30 text-sm font-medium tracking-wide text-cyan-800/70">
        {currentIndex + 1} / {fotos.length}
      </span>
      {currentIndex > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          aria-label="Foto anterior"
          className={cn('absolute left-3 top-1/2 z-30 h-12 w-12 -translate-y-1/2 sm:left-4', controlBtn)}>
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      <div className={cn(
        'relative h-full max-h-[85vh] w-full max-w-[90vw] bg-contain bg-center bg-no-repeat transition-opacity duration-300',
        commentsOpen ? 'opacity-40 sm:opacity-100' : 'opacity-100',
      )}
        style={{ backgroundImage: `url("${foto.watermarkedUrl}")` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }} />
      </div>
      {currentIndex < fotos.length - 1 && !commentsOpen && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          aria-label="Próxima foto"
          className={cn('absolute right-3 top-1/2 z-30 h-12 w-12 -translate-y-1/2 sm:right-4', controlBtn)}>
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {foto.titulo && (
        <span className="absolute left-1/2 top-5 z-30 hidden max-w-xs -translate-x-1/2 truncate rounded-full bg-white/80 px-3 py-1.5 text-[12px] text-cyan-800 shadow ring-1 ring-cyan-100 backdrop-blur sm:block">
          {foto.titulo}
        </span>
      )}

      {/* Ações principais */}
      <div className="absolute bottom-5 left-1/2 z-30 flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2.5 sm:bottom-6">
        <button onClick={(e) => { e.stopPropagation(); onCommentsOpenChange(!commentsOpen) }}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-md transition-all active:scale-95',
            commentsOpen
              ? 'bg-cyan-600 text-white shadow-cyan-300/50'
              : 'bg-white/80 text-cyan-700 ring-1 ring-cyan-100 backdrop-blur hover:bg-white',
          )}>
          <MessageCircle className="h-4 w-4" />
          {comentarios.length > 0 ? `Comentários (${comentarios.length})` : 'Comentar'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onToggleFavorito(foto.id) }}
          aria-pressed={isFavorito}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-md transition-all active:scale-95',
            isFavorito
              ? 'bg-rose-500 text-white shadow-rose-300/50'
              : 'bg-white/80 text-rose-500 ring-1 ring-rose-100 backdrop-blur hover:bg-white',
          )}>
          <Heart className="h-4 w-4" fill={isFavorito ? 'currentColor' : 'none'} />
          Gostei
        </button>
        {pendente ? (
          <button disabled
            className="flex cursor-default items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-sm font-medium text-amber-700 shadow-md">
            <Clock className="h-4 w-4" />
            Aguardando confirmação
          </button>
        ) : isSelected ? (
          <button onClick={(e) => { e.stopPropagation(); if (!foto.downloadada) onToggleSelect(foto.id) }}
            disabled={foto.downloadada}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-md transition-all active:scale-95',
              foto.downloadada ? 'cursor-default bg-teal-100 text-teal-700' : 'bg-teal-500 text-white shadow-teal-300/50 hover:bg-teal-600',
            )}>
            <Check className="h-4 w-4" />
            {foto.downloadada ? 'Inclusa no pacote (baixada)' : 'Inclusa no pacote'}
          </button>
        ) : !packageFull ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(foto.id) }}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-white/80 px-5 py-2.5 text-sm font-medium text-cyan-700 shadow-md ring-1 ring-cyan-100 backdrop-blur transition-all hover:bg-white active:scale-95 disabled:opacity-40">
            <Check className="h-4 w-4 opacity-0" />
            Incluir no pacote
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onToggleCarrinho(foto.id) }} disabled={isLoading}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-md transition-all active:scale-95',
              isLoading ? 'bg-white/80 text-cyan-700'
                : isInCart ? 'bg-cyan-500 text-white shadow-cyan-300/50 hover:bg-cyan-600'
                  : 'bg-gradient-to-r from-orange-400 to-rose-400 text-white hover:from-orange-500 hover:to-rose-500',
            )}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {isLoading ? '' : isInCart ? 'Remover' : `Comprar R$ ${valorUnitario.toFixed(2)}`}
          </button>
        )}
      </div>

      {/* Painel de comentários */}
      {commentsOpen && (
        <div onClick={(e) => e.stopPropagation()}
          className="absolute inset-y-0 right-0 z-40 flex w-full animate-in flex-col border-l border-cyan-100 bg-white/95 shadow-2xl backdrop-blur-xl duration-300 slide-in-from-right sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-cyan-100 px-4 py-3">
            <span className="flex items-center gap-2 font-display text-sm font-semibold text-cyan-950">
              <User className="h-4 w-4 text-cyan-500" />
              Comentários da foto
            </span>
            <button onClick={() => onCommentsOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 transition-colors hover:bg-cyan-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {carregandoComentarios ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              </div>
            ) : comentarios.length === 0 ? (
              <div className="py-10 text-center">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 text-cyan-300" />
                <p className="text-sm text-slate-500">Nenhum comentário ainda.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Deixe sua sugestão ou pedido sobre esta foto.
                </p>
              </div>
            ) : (
              comentarios.map((c) => <ComentarioBubble key={c.id} comentario={c} />)
            )}
          </div>

          <div className="space-y-2.5 border-t border-cyan-100 p-4">
            <input
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              maxLength={120}
              placeholder="Seu nome (opcional)"
              className="w-full rounded-xl bg-sky-50 px-3.5 py-2.5 text-[13px] text-slate-700 outline-none ring-1 ring-cyan-100 transition-shadow placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
            />
            <textarea
              value={comentarioTexto}
              onChange={(e) => setComentarioTexto(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ex.: Poderia melhorar a edição do meu corpo nessa foto?"
              className="w-full resize-none rounded-xl bg-sky-50 px-3.5 py-2.5 text-[13px] text-slate-700 outline-none ring-1 ring-cyan-100 transition-shadow placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
            />
            <button onClick={enviarComentario} disabled={enviandoComentario || !comentarioTexto.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-rose-400 py-2.5 text-sm font-semibold text-white transition-all hover:from-orange-500 hover:to-rose-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
              {enviandoComentario ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar comentário
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
