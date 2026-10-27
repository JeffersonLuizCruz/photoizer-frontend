import { useEffect, useState } from 'react'
import { AlertTriangle, Download, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { formatarBytes } from '@/shared/lib/bytes'
import { useExpurgarGaleria } from '../api/queries'
import { armazenamentoService } from '../services/armazenamento.service'
import type { GaleriaArmazenamento } from '../types/armazenamento.types'

const PALAVRA_CONFIRMACAO = 'EXPURGAR'

interface ExpurgarGaleriaDialogProps {
  galeria: GaleriaArmazenamento | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExpurgarGaleriaDialog({ galeria, open, onOpenChange }: ExpurgarGaleriaDialogProps) {
  const [confirmacao, setConfirmacao] = useState('')
  const expurgar = useExpurgarGaleria()

  useEffect(() => {
    if (!open) setConfirmacao('')
  }, [open])

  if (!galeria) return null

  const confirmado = confirmacao.trim().toUpperCase() === PALAVRA_CONFIRMACAO

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Liberar espaço desta galeria?</DialogTitle>
          <DialogDescription>
            {galeria.clienteNome || 'Galeria'} · {galeria.quantidadeFotos} foto(s) ·{' '}
            <strong>{formatarBytes(galeria.bytes)}</strong> em disco.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Serão apagados o original, a marca d'água, as miniaturas, as prévias e as versões
              editadas de todas as fotos. <strong>Esta ação não pode ser desfeita.</strong>
            </p>
          </div>
          <p className="text-muted-foreground">
            Os registros, a numeração, o histórico de seleção e compras continuam no CRM.
            Comprovantes de pagamento e contratos assinados <strong>não</strong> são afetados.
          </p>
          <a
            href={armazenamentoService.manifestoUrl(galeria.agendamentoId)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            download
          >
            <Download className="h-4 w-4" />
            Baixar manifesto (CSV) antes de apagar
          </a>

          <div className="space-y-1.5">
            <label htmlFor="confirmar-expurgo" className="text-xs font-medium text-muted-foreground">
              Digite <strong className="text-foreground">{PALAVRA_CONFIRMACAO}</strong> para confirmar
            </label>
            <Input
              id="confirmar-expurgo"
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
              placeholder={PALAVRA_CONFIRMACAO}
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={expurgar.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmado || expurgar.isPending}
            onClick={() =>
              expurgar.mutate(galeria.agendamentoId, {
                onSuccess: () => onOpenChange(false),
              })
            }
          >
            {expurgar.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Expurgar arquivos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
