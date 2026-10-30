import { useEffect, useState } from 'react'
import { Loader2, Send, ShieldAlert } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { MODO_GALERIA_META, type ModoGaleria } from '@/shared/constants/galeriaModo'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAlterarModoGaleria, usePublicarFotos } from '../../api/queries'

const OPCOES: Array<Exclude<ModoGaleria, 'DIRETO'>> = ['COM_EDICAO', 'ENTREGA_DIRETA']

interface PublicarGaleriaDialogProps {
  agendamentoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Quantidade de fotos inéditas que serão publicadas. */
  quantidade: number
  modoAtual: ModoGaleria
  /** Falso quando nenhuma foto foi publicada ainda: exige escolha do fluxo. */
  fluxoDefinido: boolean
}

export function PublicarGaleriaDialog({
  agendamentoId,
  open,
  onOpenChange,
  quantidade,
  modoAtual,
  fluxoDefinido,
}: PublicarGaleriaDialogProps) {
  const { papel } = useAuth()
  const podeEscolherFluxo = papel === 'ADMIN'
  const [modoSelecionado, setModoSelecionado] = useState<ModoGaleria | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const { mutateAsync: alterarModo, isPending: alterando } = useAlterarModoGaleria(agendamentoId)
  const { mutateAsync: publicar, isPending: publicando } = usePublicarFotos(agendamentoId)
  const isPending = alterando || publicando

  useEffect(() => {
    if (!open) return
    setModoSelecionado(fluxoDefinido ? modoAtual : null)
    setErro(null)
    // Só reinicializa ao abrir: durante o fluxo, alterarModo atualiza
    // modoAtual e não pode apagar a escolha antes de publicar.
  }, [open])

  const precisaEscolher = !fluxoDefinido
  const podeConfirmar = precisaEscolher
    ? !!modoSelecionado && podeEscolherFluxo && !isPending
    : !isPending

  const confirmar = async () => {
    if (precisaEscolher && !modoSelecionado) return
    setErro(null)
    try {
      if (precisaEscolher && modoSelecionado && modoSelecionado !== modoAtual) {
        await alterarModo(modoSelecionado)
      }
      await publicar()
      onOpenChange(false)
    } catch {
      setErro('Não foi possível concluir a publicação. Tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!isPending) onOpenChange(aberto) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {precisaEscolher ? 'Escolha o fluxo de entrega' : `Publicar ${quantidade} foto(s)`}
          </DialogTitle>
          <DialogDescription>
            {precisaEscolher
              ? 'Antes da primeira publicação, defina como o cliente receberá as fotos. Essa escolha pode ser alterada depois, enquanto não houver seleção, venda ou edição.'
              : `As fotos ficarão visíveis para o cliente na galeria. Fluxo atual: ${MODO_GALERIA_META[modoAtual].titulo}.`}
          </DialogDescription>
        </DialogHeader>

        {precisaEscolher && (
          <div className="space-y-3">
            {!podeEscolherFluxo && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Somente um administrador pode definir o fluxo e fazer a primeira publicação.</span>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {OPCOES.map((modo) => {
                const meta = MODO_GALERIA_META[modo]
                const ativo = modoSelecionado === modo
                return (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => setModoSelecionado(modo)}
                    disabled={!podeEscolherFluxo || isPending}
                    aria-pressed={ativo}
                    className={cn(
                      'flex h-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      ativo ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
                      !podeEscolherFluxo && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="text-sm font-semibold">{meta.titulo}</span>
                    <span className="text-xs text-muted-foreground">{meta.resumo}</span>
                    <span className="text-[11px] text-muted-foreground/80">{meta.detalhe}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {quantidade} foto(s) serão publicadas e ficarão visíveis para o cliente.
            </p>
          </div>
        )}

        {!precisaEscolher && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            {MODO_GALERIA_META[modoAtual].detalhe}
          </div>
        )}

        {erro && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {erro}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => void confirmar()} disabled={!podeConfirmar}>
            {isPending
              ? <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              : <Send className="mr-1 h-4 w-4" />}
            {precisaEscolher ? 'Escolher fluxo e publicar' : `Publicar ${quantidade} foto(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
