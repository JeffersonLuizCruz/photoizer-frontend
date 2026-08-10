import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Link2, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useDespesasList } from '@/features/despesas'
import { formatCurrency } from '@/shared/lib/format'
import { useVincularDespesaTrabalho } from '../api/queries'

interface VincularDespesaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamentoId: string
}

export function VincularDespesaDialog({ open, onOpenChange, agendamentoId }: VincularDespesaDialogProps) {
  const { data: despesas, isLoading } = useDespesasList()
  const vincular = useVincularDespesaTrabalho()
  const [selecionadas, setSelecionadas] = useState<string[]>([])

  const disponiveis = (despesas ?? []).filter((d) => !d.agendamentoId)

  const toggle = (id: string) => {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleVincular = () => {
    if (selecionadas.length === 0) return
    let done = 0
    selecionadas.forEach((despesaId) => {
      vincular.mutate(
        { despesaId, agendamentoId },
        {
          onSuccess: () => {
            done++
            if (done === selecionadas.length) {
              toast.success(`${selecionadas.length} despesa(s) vinculada(s)`)
              setSelecionadas([])
              onOpenChange(false)
            }
          },
          onError: (error: Error) => toast.error(error.message || 'Erro ao vincular despesa'),
        },
      )
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Vincular despesas existentes</DialogTitle>
          <DialogDescription>
            Selecione despesas que ainda não estão vinculadas a nenhum trabalho.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-1 overflow-auto">
          {isLoading && (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </p>
          )}
          {!isLoading && disponiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma despesa disponível. Todas já estão vinculadas ou não existem.
            </p>
          )}
          {disponiveis.map((d) => (
            <label
              key={d.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent"
            >
              <Checkbox checked={selecionadas.includes(d.id)} onCheckedChange={() => toggle(d.id)} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{d.descricao}</p>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(d.valor)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.cor ?? '#888' }} />
                    {d.categoria}
                  </Badge>
                  <span>{format(new Date(d.data), 'dd/MM/yyyy')}</span>
                  <Badge variant={d.status === 'PAGO' ? 'success' : 'warning'}>{d.status === 'PAGO' ? 'Pago' : 'Pendente'}</Badge>
                </div>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={vincular.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleVincular} disabled={selecionadas.length === 0 || vincular.isPending}>
            <Link2 className="mr-1 h-4 w-4" />
            Vincular {selecionadas.length > 0 ? `(${selecionadas.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
