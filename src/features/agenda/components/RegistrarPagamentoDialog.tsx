import { useState } from 'react'
import { toast } from 'sonner'
import { Banknote } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABELS, type FormaPagamento } from '@/shared/constants'
import { useRegistrarPagamentoFinal } from '../api/queries'
import type { Agendamento } from '../types'

interface RegistrarPagamentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function RegistrarPagamentoDialog({ open, onOpenChange, agendamento }: RegistrarPagamentoDialogProps) {
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(FORMA_PAGAMENTO.PIX)
  const { mutate, isPending } = useRegistrarPagamentoFinal()

  const dinheiro = formaPagamento === FORMA_PAGAMENTO.DINHEIRO
  const comprovanteObrigatorio = !dinheiro

  const handleSubmit = () => {
    if (comprovanteObrigatorio && !comprovante) {
      toast.error('Anexe o comprovante de pagamento')
      return
    }

    mutate(
      { id: agendamento.id, comprovante: comprovante ?? undefined, formaPagamento },
      {
        onSuccess: () => {
          onOpenChange(false)
          setComprovante(null)
          setFormaPagamento(FORMA_PAGAMENTO.PIX)
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

          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de pagamento</Label>
            <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
              <SelectTrigger id="formaPagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORMA_PAGAMENTO_LABELS).map(([valor, label]) => (
                  <SelectItem key={valor} value={valor}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dinheiro && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Banknote className="h-3.5 w-3.5" />
                Pagamento em dinheiro vivo não exige comprovante.
              </p>
            )}
          </div>

          <FileUpload
            accept="image/*,.pdf"
            label={
              comprovanteObrigatorio
                ? 'Comprovante de pagamento (obrigatório)'
                : 'Comprovante de pagamento (opcional)'
            }
            onFilesChange={(files) => setComprovante(files[0] ?? null)}
            maxFiles={1}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || (comprovanteObrigatorio && !comprovante)}>
            {isPending ? 'Registrando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
