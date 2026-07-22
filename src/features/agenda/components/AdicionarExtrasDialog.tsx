import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useAddFotoExtra, useConfig } from '../api/queries'
import type { Agendamento } from '../types'

interface AdicionarExtrasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function AdicionarExtrasDialog({ open, onOpenChange, agendamento }: AdicionarExtrasDialogProps) {
  const [quantidade, setQuantidade] = useState(1)
  const { mutate, isPending } = useAddFotoExtra()
  const { data: config, isLoading: configLoading } = useConfig()

  const valorUnitario = config?.valorUnitarioFotoExtra ?? 0
  const valorTotal = quantidade * valorUnitario

  const handleSubmit = () => {
    if (quantidade < 1 || !config) return
    mutate(
      { agendamentoId: agendamento.id, quantidade, valorUnitario: config.valorUnitarioFotoExtra },
      {
        onSuccess: () => {
          onOpenChange(false)
          setQuantidade(1)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Fotos Extras</DialogTitle>
          {!configLoading && config && (
            <DialogDescription>
              Adicione fotos extras ao agendamento. Valor unitário: R$ {valorUnitario.toFixed(2)}.
            </DialogDescription>
          )}
        </DialogHeader>

        {configLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : config ? (
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Quantidade de fotos
                </label>
                <Input
                  type="number"
                  min={1}
                  value={quantidade}
                  onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor unitário</span>
                  <span>R$ {valorUnitario.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span>{quantidade}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Valor total</span>
                  <span>R$ {valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || quantidade < 1 || !config}>
            {isPending ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
