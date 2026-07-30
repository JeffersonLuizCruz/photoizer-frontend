import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { useRegistrarPagamentoFinal } from '../api/queries'
import type { Agendamento } from '../types'

interface RegistrarPagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function RegistrarPagamentoDialog({ open, onOpenChange, agendamento }: RegistrarPagamentoDialogProps) {
  const [comprovante, setComprovante] = useState<File | null>(null)
  const { mutate, isPending } = useRegistrarPagamentoFinal()

  const handleSubmit = () => {
    mutate(
      { id: agendamento.id, comprovante: comprovante ?? undefined },
      {
        onSuccess: () => {
          onOpenChange(false)
          setComprovante(null)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento Final</DialogTitle>
          <DialogDescription>
            Registrar o pagamento dos 70% restantes no valor de{' '}
            <strong>R$ {agendamento.valorRestante.toFixed(2)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Restante (70%)</span>
              <span className="font-medium">R$ {agendamento.valorRestante.toFixed(2)}</span>
            </div>
          </div>

          <FileUpload
            accept="image/*,.pdf"
            label="Comprovante de pagamento (opcional)"
            onFilesChange={(files) => setComprovante(files[0] ?? null)}
            maxFiles={1}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Registrando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
