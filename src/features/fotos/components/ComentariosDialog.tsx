import { useEffect, useMemo, useState } from 'react'
import { Loader2, MessageCircle, Send, User } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { AuthImage } from '@/shared/components/ui/AuthImage'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { formatDateBR } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import type { FotoEnsaio, FotoComentario } from '../types/foto.types'
import { useComentariosAdmin, useResponderComentario, useMarcarComentariosLidos } from '../api/queries'

interface ComentariosDialogProps {
  agendamentoId: string | undefined
  foto: FotoEnsaio | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ComentarioAdminBubble({ comentario }: { comentario: FotoComentario }) {
  const isStaff = comentario.origem === 'STAFF'
  const autor = comentario.autorNome?.trim() || (isStaff ? 'Estúdio' : 'Cliente')

  return (
    <div className={cn('flex flex-col max-w-[85%]', isStaff ? 'items-end ml-auto' : 'items-start mr-auto')}>
      <span className="text-[10px] font-medium text-muted-foreground mb-0.5 px-1">
        {autor} · {formatDateBR(comentario.auditInfo.createdAt)}
      </span>
      <div className={cn(
        'rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words',
        isStaff ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'
      )}>
        {isStaff && (
          <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-100">
            <MessageCircle className="h-3 w-3" /> Sua resposta
          </span>
        )}
        {comentario.mensagem}
      </div>
    </div>
  )
}

export function ComentariosDialog({ agendamentoId, foto, open, onOpenChange }: ComentariosDialogProps) {
  const [resposta, setResposta] = useState('')

  const { data: comentariosAdmin = [], isLoading } = useComentariosAdmin(agendamentoId)
  const { mutate: responder, isPending } = useResponderComentario(agendamentoId ?? '')
  const { mutate: marcarLidos } = useMarcarComentariosLidos(agendamentoId ?? '')

  const info = useMemo(
    () => comentariosAdmin.find((item) => item.foto.id === foto?.id),
    [comentariosAdmin, foto]
  )
  const comentarios = info?.comentarios ?? []

  useEffect(() => {
    if (open && foto) marcarLidos(foto.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, foto?.id])

  const enviarResposta = () => {
    const texto = resposta.trim()
    if (!texto || !foto || isPending) return
    responder(
      { fotoId: foto.id, mensagem: texto },
      { onSuccess: () => setResposta('') }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comentários da foto</DialogTitle>
        </DialogHeader>

        {foto && (
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="h-14 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <AuthImage src={foto.thumbUrl} alt={foto.fileName} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{foto.titulo || foto.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {info && info.naoLidas > 0
                  ? `${info.naoLidas} não lido(s)`
                  : 'Nenhum comentário pendente'}
              </p>
            </div>
          </div>
        )}

        <div className="max-h-[45vh] overflow-y-auto space-y-4 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum comentário de cliente nesta foto.
              </p>
            </div>
          ) : (
            comentarios.map((c) => <ComentarioAdminBubble key={c.id} comentario={c} />)
          )}
        </div>

        {foto && (
          <div className="space-y-2.5 border-t pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Responder ao cliente — o cliente verá a resposta ao abrir a foto na galeria.
            </div>
            <Textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Digite sua resposta..."
            />
            <div className="flex justify-end">
              <Button onClick={enviarResposta} disabled={isPending || !resposta.trim()}>
                {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                <Send className="mr-1 h-4 w-4" />
                Enviar resposta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}