import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, X, Check, Clock, ShoppingCart, Loader2, MessageCircle, Send, User } from 'lucide-react'
import { toast } from 'sonner'
import type { FotoEnsaio, FotoComentario } from '../types/ecommerce.types'
import { ecommerceService } from '../services/ecommerce.service'
import { cn } from '@/shared/lib/cn'

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
    <div className={cn('flex flex-col max-w-[85%]', isStaff ? 'items-end ml-auto' : 'items-start mr-auto')}>
      <span className={cn('text-[10px] font-medium mb-0.5 px-1', isStaff ? 'text-blue-300' : 'text-zinc-400')}>
        {autor} <span className="text-zinc-500">· {formatComentarioData(comentario.createdAt)}</span>
      </span>
      <div className={cn(
        'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words shadow-md',
        isStaff ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 text-zinc-100 rounded-bl-sm'
      )}>
        {isStaff && (
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-100/90">
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
  token, commentsOpen, onCommentsOpenChange,
}: FotoViewerProps) {
  const foto = fotos[currentIndex]
  const isSelected = selectedIds.has(foto.id)
  const isInCart = carrinhoIds.has(foto.id)
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || 'Erro ao enviar comentário')
    } finally {
      setEnviandoComentario(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Fechar visualização"
        className="absolute top-4 right-4 z-30 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
        <X className="h-6 w-6 text-white" />
      </button>
      <span className="absolute top-5 left-4 z-30 text-white/60 text-sm font-medium tracking-wide">
        {currentIndex + 1} / {fotos.length}
      </span>
      {currentIndex > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          aria-label="Foto anterior"
          className="absolute left-3 sm:left-4 z-30 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
      )}
      <div className={cn(
        'max-h-[85vh] max-w-[90vw] w-full h-full bg-contain bg-center bg-no-repeat relative transition-opacity duration-300',
        commentsOpen ? 'opacity-40 sm:opacity-100' : 'opacity-100'
      )}
        style={{ backgroundImage: `url(${foto.watermarkedUrl})` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }} />
      </div>
      {currentIndex < fotos.length - 1 && !commentsOpen && (
        <button onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          aria-label="Próxima foto"
          className="absolute right-3 sm:right-4 z-30 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      )}

      {foto.titulo && (
        <span className="absolute top-5 left-1/2 -translate-x-1/2 z-30 hidden sm:block max-w-xs truncate rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white/80 backdrop-blur">
          {foto.titulo}
        </span>
      )}

      {/* Ações principais */}
      <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-wrap justify-center items-center gap-2.5 max-w-[94vw]">
        <button onClick={(e) => { e.stopPropagation(); onCommentsOpenChange(!commentsOpen) }}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-95',
            commentsOpen
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-white/10 text-white hover:bg-white/20'
          )}>
          <MessageCircle className="h-4 w-4" />
          {comentarios.length > 0 ? `Comentários (${comentarios.length})` : 'Comentar'}
        </button>
        {pendente ? (
          <button disabled
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors bg-amber-500/40 text-white/70 cursor-default">
            <Clock className="h-4 w-4" />
            Aguardando confirmação
          </button>
        ) : isSelected ? (
          <button onClick={(e) => { e.stopPropagation(); if (!foto.downloadada) onToggleSelect(foto.id) }}
            disabled={foto.downloadada}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95',
              foto.downloadada ? 'bg-emerald-500/40 text-white/70 cursor-default' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
            )}>
            <Check className="h-4 w-4" />
            {foto.downloadada ? 'Inclusa no pacote (baixada)' : 'Inclusa no pacote'}
          </button>
        ) : !packageFull ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleSelect(foto.id) }}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95 bg-white/10 text-white hover:bg-white/20 disabled:opacity-40">
            <Check className="h-4 w-4 opacity-0" />
            Incluir no pacote
          </button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onToggleCarrinho(foto.id) }} disabled={isLoading}
            className={cn(
              'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95',
              isLoading ? 'bg-white/10 text-white' :
                isInCart ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white/10 text-white hover:bg-white/20'
            )}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {isLoading ? '' : isInCart ? 'Remover' : `Comprar R$ ${valorUnitario.toFixed(2)}`}
          </button>
        )}
      </div>

      {/* Painel de comentários */}
      {commentsOpen && (
        <div onClick={(e) => e.stopPropagation()}
          className="absolute inset-y-0 right-0 z-40 w-full sm:w-[360px] bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Comentários da foto
            </span>
            <button onClick={() => onCommentsOpenChange(false)}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {carregandoComentarios ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
              </div>
            ) : comentarios.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">Nenhum comentário ainda.</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Deixe sua sugestão ou pedido sobre esta foto.
                </p>
              </div>
            ) : (
              comentarios.map((c) => <ComentarioBubble key={c.id} comentario={c} />)
            )}
          </div>

          <div className="border-t border-white/10 p-4 space-y-2.5">
            <input
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              maxLength={120}
              placeholder="Seu nome (opcional)"
              className="w-full rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-500 outline-none ring-0 focus:ring-2 focus:ring-blue-500/60 transition-shadow"
            />
            <textarea
              value={comentarioTexto}
              onChange={(e) => setComentarioTexto(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Ex.: Poderia melhorar a edição do meu corpo nessa foto?"
              className="w-full rounded-xl bg-white/10 px-3.5 py-2.5 text-[13px] text-white placeholder:text-zinc-500 outline-none ring-0 focus:ring-2 focus:ring-blue-500/60 transition-shadow resize-none"
            />
            <button onClick={enviarComentario} disabled={enviandoComentario || !comentarioTexto.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm font-medium py-2.5 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
              {enviandoComentario ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar comentário
            </button>
          </div>
        </div>
      )}
    </div>
  )
}