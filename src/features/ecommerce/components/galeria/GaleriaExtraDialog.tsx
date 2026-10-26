import { ShoppingBag } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import type { FotoEnsaio } from '../../types/ecommerce.types'
import { numeroGaleriaLabel } from '@/shared/lib/foto'

interface GaleriaExtraDialogProps {
  foto: FotoEnsaio | null
  open: boolean
  valor: number
  extrasEmSelecao: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function GaleriaExtraDialog({
  foto,
  open,
  valor,
  extrasEmSelecao,
  onOpenChange,
  onConfirm,
}: GaleriaExtraDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 border-gallery-line bg-gallery-bg text-gallery-ink">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl text-gallery-ink">
            Incluir esta foto como extra?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-gallery-muted">
            Esta foto não está incluída no seu pacote. Você pode incluí-la como extra
            {extrasEmSelecao
              ? ' e ela será editada junto com as demais.'
              : ' e baixá-la após a confirmação do pagamento.'}
          </DialogDescription>
        </DialogHeader>

        {foto && (
          <div className="flex items-center gap-3 rounded-sm border border-gallery-line bg-gallery-surface p-2">
            <img
              src={foto.thumbUrl}
              alt={foto.fileName}
              className="h-16 w-20 rounded-[2px] object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gallery-ink">
                {foto.numeroGaleria != null ? numeroGaleriaLabel(foto.numeroGaleria) : 'Foto extra'}
              </p>
              <p className="mt-0.5 text-[11px] text-gallery-muted">Foto extra</p>
              <p className="mt-1 text-sm font-semibold text-gallery-ink">{formatBRL(valor)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="min-h-11 rounded-full border border-gallery-line bg-gallery-surface px-4 text-xs font-medium text-gallery-ink transition-colors hover:bg-gallery-line/40"
          >
            Agora não
          </button>
          <button
            onClick={onConfirm}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-gallery-ink px-5 text-xs font-semibold text-gallery-bg transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {extrasEmSelecao ? 'Incluir extra' : 'Comprar foto'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
