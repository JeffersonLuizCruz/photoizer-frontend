import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Camera,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  ListChecks,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { ecommerceService } from '@/features/ecommerce/services/ecommerce.service'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { StatusBadge } from '@/shared/components/layout/StatusBadge'
import { ConfirmDialog } from '@/shared/components/layout/ConfirmDialog'
import { extractErrorMessage } from '@/shared/api'
import { copyToClipboard } from '@/shared/lib/clipboard'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function resolverLinkGaleria(linkGaleria: string | null, tokenGaleria: string | null): string | null {
  const candidato = linkGaleria?.trim() || (tokenGaleria ? `/g/${tokenGaleria}` : null)
  if (!candidato) return null
  try {
    return new URL(candidato, window.location.origin).toString()
  } catch {
    return null
  }
}

function ResumoCard({ titulo, valor, detalhe }: { titulo: string; valor: string | number; detalhe?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="text-lg font-bold">{valor}</p>
      {detalhe && <p className="mt-0.5 text-[11px] text-muted-foreground">{detalhe}</p>}
    </div>
  )
}

export function EcommerceAdminResumo({ agendamentoId }: { agendamentoId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-ecommerce', agendamentoId],
    queryFn: () => ecommerceService.adminResumo(agendamentoId),
  })

  const { mutate: regenToken, isPending: isRegenning } = useMutation({
    mutationFn: () => ecommerceService.adminRegenToken(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ecommerce', agendamentoId] })
      queryClient.invalidateQueries({ queryKey: ['agendamento', agendamentoId] })
      setShowRegenConfirm(false)
      toast.success('Token regenerado! O link anterior não funciona mais.')
    },
    onError: (error: Error) => toast.error(extractErrorMessage(error, 'Erro ao regenerar token')),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-4 py-12 text-center">
        <AlertTriangle className="mb-2 h-8 w-8 text-amber-600" />
        <p className="text-sm font-medium">Não foi possível carregar o resumo do e-commerce</p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {extractErrorMessage(error, 'Tente novamente em instantes.')}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageIcon className="mb-2 h-8 w-8" />
        <p className="text-sm">Nenhum dado disponível</p>
      </div>
    )
  }

  const linkGaleria = resolverLinkGaleria(data.linkGaleria, data.tokenGaleria)
  const compras = data.comprasExtras ?? []
  const pendentes = compras.filter(
    (compra) => compra.status === 'AGUARDANDO_COMPROVANTE' || compra.status === 'AGUARDANDO_CONFIRMACAO',
  )
  const pagas = compras.filter((compra) => compra.status === 'PAGA')
  const totalCurtidas = Object.values(data.favoritosPorFoto ?? {}).reduce((acc, n) => acc + n, 0)

  const copiarLink = async () => {
    if (!linkGaleria) {
      toast.error('Link da galeria não disponível')
      return
    }
    try {
      await copyToClipboard(linkGaleria)
      toast.success('Link da galeria copiado!')
    } catch {
      toast.error('Não foi possível copiar o link. Copie manualmente o endereço exibido.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos`)}>
          <Camera className="mr-1 h-4 w-4" />
          Abrir galeria
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=fotos`)}>
          <ImageIcon className="mr-1 h-4 w-4" />
          Gerenciar fotos
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=selecao`)}>
          <ListChecks className="mr-1 h-4 w-4" />
          Ver seleção
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=compras`)}>
          <ShoppingBag className="mr-1 h-4 w-4" />
          Ver compras
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowRegenConfirm(true)} disabled={isRegenning}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Regenerar token
        </Button>
      </div>

      {linkGaleria && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2">
          <Link2 className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={linkGaleria}
            readOnly
            aria-label="Link público da galeria"
            className="min-w-0 flex-1 basis-full bg-background text-xs sm:basis-auto"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button variant="ghost" size="sm" onClick={copiarLink}>
            <Copy className="mr-1 h-4 w-4" />
            Copiar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Abrir link da galeria do cliente"
            onClick={() => window.open(linkGaleria, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            Abrir
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <ResumoCard titulo="Total" valor={data.totalFotos} />
        <ResumoCard titulo="Curtidas" valor={totalCurtidas} />
        <ResumoCard titulo="Publicadas" valor={data.fotosPublicadas} />
        <ResumoCard titulo="No pacote" valor={data.fotosSelecionadasPacote} />
        <ResumoCard titulo="Pagas" valor={data.fotosPagas} />
        <ResumoCard titulo="Aguardando" valor={data.fotosAguardando} />
        <ResumoCard titulo="Valor extras" valor={formatCurrency(data.valorTotalExtras)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Compras de extras</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {compras.length} compra(s) · {pendentes.length} pendente(s) · {pagas.length} paga(s)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=compras`)}>
              Gerenciar
            </Button>
          </div>

          {compras.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Nenhuma compra de extra ainda. As compras aparecem aqui e no workspace da galeria.
            </p>
          ) : (
            <ul className="space-y-2">
              {compras.slice(0, 3).map((compra) => (
                <li key={compra.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs">
                  <span className="min-w-0 truncate">
                    <span className="font-mono text-muted-foreground">#{compra.id.slice(0, 8)}</span>
                    <span className="ml-2 font-medium">{formatCurrency(compra.valorTotal)}</span>
                  </span>
                  <StatusBadge
                    status={
                      compra.status === 'PAGA'
                        ? 'paid'
                        : compra.status === 'AGUARDANDO_CONFIRMACAO'
                          ? 'warning'
                          : compra.status === 'CANCELADA'
                            ? 'cancelled'
                            : 'inactive'
                    }
                    customLabels={{
                      paid: { label: 'Pago', variant: 'success' },
                      warning: { label: 'Aguad. Confirmação', variant: 'warning' },
                      cancelled: { label: 'Cancelada', variant: 'secondary' },
                      inactive: { label: 'Aguad. Comprovante', variant: 'secondary' },
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4">
          <div>
            <h3 className="text-sm font-semibold">Seleção e edição</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Pacote, extras, upload das editadas e publicação ficam na aba Seleção do workspace. No menu de cada foto da aba Fotos é possível ajustar manualmente a seleção.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=selecao`)}>
              <ListChecks className="mr-1 h-4 w-4" />
              Abrir seleção
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/agenda/${agendamentoId}/fotos?tab=fotos`)}>
              <ImageIcon className="mr-1 h-4 w-4" />
              Abrir fotos
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showRegenConfirm}
        onOpenChange={setShowRegenConfirm}
        onConfirm={() => regenToken()}
        isLoading={isRegenning}
        title="Regenerar Token?"
        description="O link atual da galeria deixará de funcionar. Um novo link será gerado. Tem certeza?"
        confirmText="Regenerar"
        variant="default"
      />
    </div>
  )
}
