import { useState, useEffect } from 'react'
import { Star, MessageSquare, Loader2 } from 'lucide-react'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import type { Avaliacao } from '@/features/ecommerce/types/ecommerce.types'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { toast } from 'sonner'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function StarRating({ value, onChange, readonly }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`h-5 w-5 ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export function DepoimentosSection() {
  const [depoimentos, setDepoimentos] = useState<Avaliacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [pontuacao, setPontuacao] = useState(0)
  const [comentario, setComentario] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    ecommerceService.listarDepoimentos()
      .then(setDepoimentos)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSubmit() {
    if (pontuacao === 0) {
      toast.error('Selecione uma pontuação')
      return
    }
    setIsSaving(true)
    try {
      await ecommerceService.criarAvaliacao({
        clienteId: '',
        agendamentoId: null,
        pacoteId: null,
        pontuacao,
        comentario: comentario || null,
        depoimento: true,
      })
      toast.success('Depoimento enviado! Aguarde aprovação.')
      setShowForm(false)
      setPontuacao(0)
      setComentario('')
    } catch {
      toast.error('Erro ao enviar depoimento')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Depoimentos</h2>
          <p className="text-sm text-muted-foreground">O que nossos clientes dizem</p>
        </div>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <MessageSquare className="mr-1 h-4 w-4" />
            Avaliar
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="text-sm font-medium">Deixe sua avaliação</h3>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Sua nota</p>
            <StarRating value={pontuacao} onChange={setPontuacao} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Comentário (opcional)</p>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte sua experiência..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setPontuacao(0); setComentario('') }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : depoimentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum depoimento ainda</p>
          <p className="text-xs mt-1">Seja o primeiro a avaliar!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {depoimentos.map((d) => (
            <div key={d.id} className="rounded-xl border bg-card p-4 space-y-2">
              <StarRating value={d.pontuacao} readonly />
              {d.comentario && (
                <p className="text-sm text-muted-foreground">{d.comentario}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
