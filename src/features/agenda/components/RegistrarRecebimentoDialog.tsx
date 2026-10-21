import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { CurrencyInput } from '@/shared/components/layout/CurrencyInput'
import { FileUpload } from '@/shared/components/layout/FileUpload'
import { FORMA_PAGAMENTO_LABELS, type FormaPagamento } from '@/shared/constants'
import { formatCurrency } from '@/shared/lib/format'
import { useRegistrarRecebimento } from '../api/queries'
import type { Agendamento } from '../types'

interface RegistrarRecebimentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento
}

export function RegistrarRecebimentoDialog({ open, onOpenChange, agendamento }: RegistrarRecebimentoDialogProps) {
  const [valor, setValor] = useState(0)
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX')
  const [tipoPagamento, setTipoPagamento] = useState<'ENTRADA' | 'FINAL'>('ENTRADA')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [observacao, setObservacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const { mutate, isPending } = useRegistrarRecebimento()

  const entradaPendente = Math.max(
    0,
    (agendamento.valorEntradaExigido ?? 0) - (agendamento.valorEntradaPago ?? 0),
  )

  useEffect(() => {
    if (!open) return
    const sugestao = entradaPendente > 0
      ? Math.min(entradaPendente, agendamento.valorRestante)
      : agendamento.valorRestante
    setValor(Number(sugestao.toFixed(2)))
    setDataPagamento(format(new Date(), 'yyyy-MM-dd'))
    setFormaPagamento('PIX')
    setTipoPagamento(entradaPendente > 0 ? 'ENTRADA' : 'FINAL')
    setComprovante(null)
    setObservacao('')
    setErro(null)
  }, [open, entradaPendente, agendamento.valorRestante])

  const handleSubmit = () => {
    if (valor <= 0) {
      setErro('Informe um valor maior que zero')
      return
    }
    if (valor > agendamento.valorRestante) {
      setErro('O valor não pode ser maior que o saldo restante')
      return
    }
    setErro(null)
    mutate(
      {
        id: agendamento.id,
        valor,
        dataPagamento: `${dataPagamento}T12:00:00`,
        formaPagamento,
        tipoPagamento,
        comprovante: comprovante ?? undefined,
        observacao: observacao.trim() || undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            Registre a entrada, um valor parcial ou o pagamento final de{' '}
            <strong>{agendamento.clienteNome ?? 'este agendamento'}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo restante</span>
              <span className="font-medium">{formatCurrency(agendamento.valorRestante)}</span>
            </div>
            {entradaPendente > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Entrada pendente</span>
                <span className="font-medium text-amber-600">{formatCurrency(entradaPendente)}</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="valorRecebimento">Valor recebido (R$)</Label>
              <CurrencyInput id="valorRecebimento" value={valor} onChange={setValor} />
            </div>
            <div>
              <Label htmlFor="dataRecebimento">Data do recebimento</Label>
              <Input
                id="dataRecebimento"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="formaRecebimento">Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}>
                <SelectTrigger id="formaRecebimento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipoRecebimento">Tipo</Label>
              <Select value={tipoPagamento} onValueChange={(v) => setTipoPagamento(v as 'ENTRADA' | 'FINAL')}>
                <SelectTrigger id="tipoRecebimento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="FINAL">Pagamento final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacaoRecebimento">Observação</Label>
            <Textarea
              id="observacaoRecebimento"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Ex.: recebido em dinheiro no estúdio"
            />
          </div>

          <div className="space-y-2">
            <FileUpload
              accept="image/*,.pdf"
              label="Comprovante (opcional)"
              onFilesChange={(files) => setComprovante(files[0] ?? null)}
              maxFiles={1}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Registrando...' : 'Confirmar recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
