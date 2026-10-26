import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, Lock, Pencil, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { AdminPagamentoConfigDialog } from '@/features/ecommerce/components/AdminPagamentoConfigDialog'

interface GaleriaPagamentoPixCardProps {
  /** Somente ADMIN pode alterar a chave PIX do e-commerce. */
  podeEditar: boolean
}

/**
 * Controle da chave PIX global usado no checkout das galerias.
 *
 * A chave é única para todas as galerias; este card traz o controle para o
 * workspace da galeria, sem precisar ir em Pedidos → Ecommerce.
 */
export function GaleriaPagamentoPixCard({ podeEditar }: GaleriaPagamentoPixCardProps) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['pagamento-ecommerce-publico'],
    queryFn: () => ecommerceService.obterPagamento(),
  })

  const copiar = () => {
    if (!data?.pixChave) return
    navigator.clipboard.writeText(data.pixChave)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
    toast.success('Chave PIX copiada!')
  }

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ['pagamento-ecommerce-publico'] })
    void queryClient.invalidateQueries({ queryKey: ['pagamento-ecommerce'] })
  }

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-cyan-100 p-2 text-cyan-700">
            <QrCode className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Pagamento PIX</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Chave usada no checkout de todas as galerias.
            </p>
          </div>
        </div>

        {podeEditar ? (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" />
            Editar PIX
          </Button>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Lock className="h-3 w-3" />
            Somente ADMIN altera
          </span>
        )}
      </div>

      <div className="mt-3 rounded-lg border bg-background p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando chave PIX...
          </div>
        ) : isError ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-amber-700">Não foi possível carregar a chave PIX.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : data?.pixChave ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-xs text-muted-foreground">
              {data.pixTipoChave ? (
                <span className="font-medium text-foreground">{data.pixTipoChave}: </span>
              ) : null}
              <code className="break-all font-mono text-foreground">{data.pixChave}</code>
            </p>
            <button
              type="button"
              onClick={copiar}
              className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-amber-700">
            PIX ainda não configurado. O checkout ficará indisponível para pagamento via PIX.
          </p>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        A chave é global: alterações valem imediatamente para todas as galerias e para
        compras PIX pendentes.
      </p>

      <AdminPagamentoConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={invalidar}
      />
    </section>
  )
}
